import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// DELETE - Cancel withdrawal request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = currentUser.id
    const { id } = params

    // Find request
    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
    })

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Check ownership
    if (request.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Can only cancel pending requests
    if (request.status !== "PENDING") {
      return NextResponse.json(
        { error: "Можно отменить только заявки в статусе 'Ожидает'" },
        { status: 400 }
      )
    }

    // Delete request
    await prisma.withdrawalRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error canceling withdrawal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
