import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// PATCH - Update withdrawal request status (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const { status, adminNote } = body

    // Validate status
    if (!["PENDING", "PROCESSING", "COMPLETED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Find request
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // If completing withdrawal, deduct from user balance
    if (status === "COMPLETED" && request.status !== "COMPLETED") {
      // Check if user has enough balance
      if (request.user.balance < request.amount) {
        return NextResponse.json(
          { error: "У пользователя недостаточно средств" },
          { status: 400 }
        )
      }

      // Use transaction to update both records
      await prisma.$transaction([
        // Deduct from user balance
        prisma.user.update({
          where: { id: request.userId },
          data: {
            balance: { decrement: request.amount },
          },
        }),
        // Create transaction record
        prisma.transaction.create({
          data: {
            userId: request.userId,
            type: "WITHDRAWAL",
            amount: -request.amount,
            status: "COMPLETED",
            description: `Вывод средств (${request.method})`,
          },
        }),
        // Update withdrawal request
        prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status,
            adminNote,
            processedAt: new Date(),
          },
        }),
      ])
    } else {
      // Just update status
      await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status,
          adminNote,
          processedAt: status === "COMPLETED" || status === "REJECTED" ? new Date() : undefined,
        },
      })
    }

    // Send email notification to user
    try {
      const emailSubject = status === "COMPLETED" 
        ? "Вывод средств выполнен" 
        : status === "REJECTED" 
          ? "Заявка на вывод отклонена"
          : "Ваша заявка в обработке"

      const emailBody = status === "COMPLETED"
        ? `Ваша заявка на вывод ${request.amount} ₽ успешно выполнена.`
        : status === "REJECTED"
          ? `Ваша заявка на вывод ${request.amount} ₽ была отклонена.${adminNote ? ` Причина: ${adminNote}` : ""}`
          : `Ваша заявка на вывод ${request.amount} ₽ взята в обработку.`

      // Would send email here using nodemailer
      console.log(`Email to ${request.user.email}: ${emailSubject}`)
    } catch (emailError) {
      console.error("Error sending email:", emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating withdrawal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get single withdrawal request details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = params

    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            createdAt: true,
          },
        },
      },
    })

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Get user's withdrawal history
    const userHistory = await prisma.withdrawalRequest.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return NextResponse.json({ request, userHistory })
  } catch (error) {
    console.error("Error fetching withdrawal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
