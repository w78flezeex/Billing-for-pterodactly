"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  FolderOpen,
  Save,
  Search,
  BarChart3,
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  sortOrder: number
  _count?: { articles: number }
}

interface Article {
  id: string
  categoryId: string
  title: string
  slug: string
  content: string
  views: number
  isPublished: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  category?: Category
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [categorySlug, setCategorySlug] = useState("")
  const [categoryIcon, setCategoryIcon] = useState("")
  const [categorySaving, setCategorySaving] = useState(false)

  // Article dialog
  const [articleDialogOpen, setArticleDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [articleTitle, setArticleTitle] = useState("")
  const [articleSlug, setArticleSlug] = useState("")
  const [articleContent, setArticleContent] = useState("")
  const [articleCategoryId, setArticleCategoryId] = useState("")
  const [articleIsPublished, setArticleIsPublished] = useState(true)
  const [articleSaving, setArticleSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, artRes] = await Promise.all([
        fetch("/api/admin/knowledge/categories"),
        fetch("/api/admin/knowledge/articles"),
      ])
      
      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }
      
      if (artRes.ok) {
        const artData = await artRes.json()
        setArticles(artData.articles || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Category functions
  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryName(category.name)
      setCategorySlug(category.slug)
      setCategoryIcon(category.icon || "")
    } else {
      setEditingCategory(null)
      setCategoryName("")
      setCategorySlug("")
      setCategoryIcon("")
    }
    setCategoryDialogOpen(true)
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[а-яё]/g, (char) => {
        const map: Record<string, string> = {
          а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
          з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
          п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
          ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
        }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const saveCategory = async () => {
    if (!categoryName || !categorySlug) return

    setCategorySaving(true)
    try {
      const url = editingCategory
        ? `/api/admin/knowledge/categories/${editingCategory.id}`
        : "/api/admin/knowledge/categories"
      
      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          slug: categorySlug,
          icon: categoryIcon,
        }),
      })

      if (!res.ok) throw new Error("Ошибка сохранения")
      
      setCategoryDialogOpen(false)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCategorySaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm("Удалить категорию? Все статьи в ней тоже будут удалены!")) return

    try {
      const res = await fetch(`/api/admin/knowledge/categories/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Ошибка удаления")
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Article functions
  const openArticleDialog = (article?: Article) => {
    if (article) {
      setEditingArticle(article)
      setArticleTitle(article.title)
      setArticleSlug(article.slug)
      setArticleContent(article.content)
      setArticleCategoryId(article.categoryId)
      setArticleIsPublished(article.isPublished)
    } else {
      setEditingArticle(null)
      setArticleTitle("")
      setArticleSlug("")
      setArticleContent("")
      setArticleCategoryId(categories[0]?.id || "")
      setArticleIsPublished(true)
    }
    setArticleDialogOpen(true)
  }

  const saveArticle = async () => {
    if (!articleTitle || !articleSlug || !articleCategoryId || !articleContent) return

    setArticleSaving(true)
    try {
      const url = editingArticle
        ? `/api/admin/knowledge/articles/${editingArticle.id}`
        : "/api/admin/knowledge/articles"
      
      const res = await fetch(url, {
        method: editingArticle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleTitle,
          slug: articleSlug,
          content: articleContent,
          categoryId: articleCategoryId,
          isPublished: articleIsPublished,
        }),
      })

      if (!res.ok) throw new Error("Ошибка сохранения")
      
      setArticleDialogOpen(false)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setArticleSaving(false)
    }
  }

  const deleteArticle = async (id: string) => {
    if (!confirm("Удалить статью?")) return

    try {
      const res = await fetch(`/api/admin/knowledge/articles/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Ошибка удаления")
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === "all" || article.categoryId === filterCategory
    return matchesSearch && matchesCategory
  })

  // Stats
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0)
  const publishedCount = articles.filter((a) => a.isPublished).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">База знаний</h1>
              <p className="text-muted-foreground">Управление статьями и категориями</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Категорий</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{articles.length}</p>
                  <p className="text-sm text-muted-foreground">Статей</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalViews}</p>
                  <p className="text-sm text-muted-foreground">Просмотров</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publishedCount}</p>
                  <p className="text-sm text-muted-foreground">Опубликовано</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="articles">
          <TabsList className="mb-6">
            <TabsTrigger value="articles">Статьи</TabsTrigger>
            <TabsTrigger value="categories">Категории</TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Статьи</CardTitle>
                  <Button onClick={() => openArticleDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить статью
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск статей..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filteredArticles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Нет статей</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Просмотры</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Обновлено</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{article.title}</TableCell>
                          <TableCell>
                            {categories.find((c) => c.id === article.categoryId)?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              {article.views}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={article.isPublished ? "default" : "secondary"}>
                              {article.isPublished ? "Опубликовано" : "Черновик"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(article.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/faq/${article.slug}`, "_blank")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openArticleDialog(article)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteArticle(article.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Категории</CardTitle>
                  <Button onClick={() => openCategoryDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить категорию
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Нет категорий</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Иконка</TableHead>
                        <TableHead>Статей</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                          <TableCell>{category.icon || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{category._count?.articles || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCategoryDialog(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Редактировать категорию" : "Новая категория"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название</Label>
                <Input
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value)
                    if (!editingCategory) {
                      setCategorySlug(generateSlug(e.target.value))
                    }
                  }}
                  placeholder="Начало работы"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="getting-started"
                />
              </div>
              <div className="space-y-2">
                <Label>Иконка (эмодзи)</Label>
                <Input
                  value={categoryIcon}
                  onChange={(e) => setCategoryIcon(e.target.value)}
                  placeholder="🚀"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={saveCategory} disabled={categorySaving}>
                {categorySaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Article Dialog */}
        <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArticle ? "Редактировать статью" : "Новая статья"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={articleTitle}
                    onChange={(e) => {
                      setArticleTitle(e.target.value)
                      if (!editingArticle) {
                        setArticleSlug(generateSlug(e.target.value))
                      }
                    }}
                    placeholder="Как создать сервер"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={articleSlug}
                    onChange={(e) => setArticleSlug(e.target.value)}
                    placeholder="kak-sozdat-server"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={articleCategoryId} onValueChange={setArticleCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      checked={articleIsPublished}
                      onCheckedChange={setArticleIsPublished}
                    />
                    <span>{articleIsPublished ? "Опубликовано" : "Черновик"}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Содержимое (Markdown)</Label>
                <Textarea
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="# Заголовок&#10;&#10;Содержимое статьи..."
                  rows={15}
                  className="font-mono"
                />
              </div>
              {editingArticle && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {editingArticle.views} просмотров
                  </span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={saveArticle} disabled={articleSaving}>
                {articleSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
