import React, { useState, useEffect, useMemo } from 'react'
import {
  FolderTree, Plus, Edit2, Trash2, Sparkles, Folder, Briefcase,
  Code, Book, BookOpen, Activity, Dumbbell, Heart, Wallet,
  PieChart, TrendingUp, Coffee, Tv, Smile, AlertTriangle,
  Smartphone, Clock, Target, Zap, ChevronRight, CornerDownRight,
  ShieldCheck, HelpCircle, Check, X, RotateCcw
} from 'lucide-react'
import { useTaskStore, type Category } from '../store/useTaskStore'
import { sounds } from '../utils/soundEffects'

const ICON_MAP: Record<string, any> = {
  folder: Folder,
  briefcase: Briefcase,
  code: Code,
  book: Book,
  'book-open': BookOpen,
  activity: Activity,
  dumbbell: Dumbbell,
  heart: Heart,
  wallet: Wallet,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  coffee: Coffee,
  tv: Tv,
  smile: Smile,
  'alert-triangle': AlertTriangle,
  smartphone: Smartphone,
  clock: Clock,
  target: Target,
  zap: Zap
}

const PRESET_COLORS = [
  '#8B5CF6', // Violet
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red / Rose
  '#EC4899', // Pink
  '#64748B'  // Slate
]

export const CategoryManagement: React.FC = () => {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, seedPresetCategories } = useTaskStore()
  
  const [filterType, setFilterType] = useState<'all' | 'productive' | 'neutral' | 'wasted'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [presetConfirmOpen, setPresetConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState('#8B5CF6')
  const [formIcon, setFormIcon] = useState('folder')
  const [formParentId, setFormParentId] = useState<number | null>(null)
  const [formCategoryType, setFormCategoryType] = useState<'productive' | 'neutral' | 'wasted'>('productive')

  useEffect(() => {
    fetchCategories()
  }, [])

  // Separate parent and child categories
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_id)
  }, [categories])

  const filteredParents = useMemo(() => {
    if (filterType === 'all') return parentCategories
    return parentCategories.filter(c => (c.category_type || 'productive') === filterType)
  }, [parentCategories, filterType])

  // Summary counts
  const productiveMins = useMemo(() => {
    return categories
      .filter(c => (c.category_type || 'productive') === 'productive')
      .reduce((sum, c) => sum + (c.focus_minutes || 0), 0)
  }, [categories])

  const neutralMins = useMemo(() => {
    return categories
      .filter(c => c.category_type === 'neutral')
      .reduce((sum, c) => sum + (c.focus_minutes || 0), 0)
  }, [categories])

  const wastedMins = useMemo(() => {
    return categories
      .filter(c => c.category_type === 'wasted')
      .reduce((sum, c) => sum + (c.focus_minutes || 0), 0)
  }, [categories])

  const handleOpenAddModal = (parentId: number | null = null) => {
    sounds.playTap()
    setEditingCategory(null)
    setFormName('')
    setFormColor('#8B5CF6')
    setFormIcon(parentId ? 'code' : 'folder')
    setFormParentId(parentId)

    // Inherit category type from parent if creating subcategory
    if (parentId) {
      const parent = categories.find(c => c.id === parentId)
      if (parent) {
        setFormCategoryType(parent.category_type || 'productive')
        setFormColor(parent.color || '#8B5CF6')
      }
    } else {
      setFormCategoryType('productive')
    }

    setModalOpen(true)
  }

  const handleOpenEditModal = (cat: Category) => {
    sounds.playTap()
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormColor(cat.color || '#8B5CF6')
    setFormIcon(cat.icon || 'folder')
    setFormParentId(cat.parent_id || null)
    setFormCategoryType(cat.category_type || 'productive')
    setModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      sounds.playTap()

      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formName.trim(),
          color: formColor,
          icon: formIcon,
          parent_id: formParentId || undefined,
          category_type: formCategoryType
        })
      } else {
        await createCategory({
          name: formName.trim(),
          color: formColor,
          icon: formIcon,
          parent_id: formParentId || undefined,
          category_type: formCategoryType
        })
      }

      sounds.playSuccess()
      setModalOpen(false)
    } catch (err) {
      console.error('Failed to save category', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    sounds.playTap()
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      await deleteCategory(id)
      sounds.playSuccess()
    }
  }

  const handleSeedPresets = async () => {
    try {
      setIsSubmitting(true)
      sounds.playTap()
      await seedPresetCategories()
      sounds.playSuccess()
      setPresetConfirmOpen(false)
    } catch (err) {
      console.error('Failed to seed categories', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderIcon = (iconName?: string, className = 'w-4 h-4') => {
    const IconComp = iconName ? ICON_MAP[iconName] || Folder : Folder
    return <IconComp className={className} />
  }

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'wasted':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            🔴 Wasted / Distraction
          </span>
        )
      case 'neutral':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            🔵 Neutral / Maintenance
          </span>
        )
      case 'productive':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 Productive / Value
          </span>
        )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto space-y-5 pb-24">
        {/* ── Ergonomic Header ─────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-violet-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Time Allocation & Hierarchy
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Category Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Categorize time blocks & tasks with value group auditing (Productive, Neutral, or Distraction).
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { sounds.playTap(); setPresetConfirmOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs active:scale-95 transition"
              title="Load standard preset categories"
            >
              <RotateCcw className="w-3.5 h-3.5 text-violet-600" />
              <span>Load Presets</span>
            </button>

            <button
              onClick={() => handleOpenAddModal(null)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-xs active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {/* ── Time Allocation Metrics ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 border border-emerald-200/70 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">🟢 Productive</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-100/70 text-emerald-800 rounded-md">
                {categories.filter(c => (c.category_type || 'productive') === 'productive').length} items
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono mt-2">
              {Math.round(productiveMins)} <span className="text-xs font-normal text-slate-500">focus mins</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Deep work, coding, learning & fitness</div>
          </div>

          <div className="glass rounded-2xl p-4 border border-sky-200/70 bg-sky-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800">🔵 Neutral / Rest</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-sky-100/70 text-sky-800 rounded-md">
                {categories.filter(c => c.category_type === 'neutral').length} items
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono mt-2">
              {Math.round(neutralMins)} <span className="text-xs font-normal text-slate-500">focus mins</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Routine syncs, meals & socializing</div>
          </div>

          <div className="glass rounded-2xl p-4 border border-rose-200/70 bg-rose-50/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">🔴 Wasted / Distraction</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-rose-100/70 text-rose-800 rounded-md">
                {categories.filter(c => c.category_type === 'wasted').length} items
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono mt-2">
              {Math.round(wastedMins)} <span className="text-xs font-normal text-slate-500">logged mins</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Doomscrolling, procrastination, delays</div>
          </div>
        </div>

        {/* ── Filter Tabs ─────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'productive', label: '🟢 Productive' },
            { id: 'neutral', label: '🔵 Neutral' },
            { id: 'wasted', label: '🔴 Wasted' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.playTap(); setFilterType(tab.id as any) }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Hierarchical Category Tree / Cards ─────── */}
        {filteredParents.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No categories found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You can create a new parent category or load preset categories to get started instantly.
            </p>
            <button
              onClick={() => handleSeedPresets()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Preset Categories</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParents.map(parent => (
              <div
                key={parent.id}
                className="glass rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                {/* Parent Category Header Card */}
                <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: parent.color }}
                    >
                      {renderIcon(parent.icon, 'w-5 h-5 text-white')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 truncate">
                          {parent.name}
                        </span>
                        {getTypeBadge(parent.category_type)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
                        <span>{parent.subcategories?.length || 0} sub-categories</span>
                        <span>•</span>
                        <span>{parent.tasks_count || 0} tasks</span>
                        <span>•</span>
                        <span className="font-mono">{Math.round(parent.focus_minutes || 0)}m focus</span>
                      </div>
                    </div>
                  </div>

                  {/* Parent Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleOpenAddModal(parent.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition"
                      title="Add sub-category"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Sub</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(parent)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(parent.id, parent.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                {parent.subcategories && parent.subcategories.length > 0 ? (
                  <div className="p-3 bg-slate-50/50 space-y-2">
                    {parent.subcategories.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-violet-200 transition shadow-2xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pl-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: sub.color || parent.color }}
                          >
                            {renderIcon(sub.icon, 'w-3.5 h-3.5 text-white')}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                              <span>{sub.tasks_count || 0} tasks</span>
                              <span>•</span>
                              <span className="font-mono">{Math.round(sub.focus_minutes || 0)}m focus</span>
                            </div>
                          </div>
                        </div>

                        {/* Subcategory Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Edit Subcategory"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(sub.id, sub.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-3 bg-slate-50/40 text-[11px] text-slate-400 italic flex items-center gap-1.5">
                    <span>No sub-categories yet. Click "+ Add Sub" to organize deeper.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Add / Edit Category ─────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 anim-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? 'Edit Category' : formParentId ? 'Add Sub-Category' : 'Add Parent Category'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Development, English Speaking..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                />
              </div>

              {/* Parent Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent Category
                </label>
                <select
                  value={formParentId || ''}
                  onChange={(e) => setFormParentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">-- Level 1 Parent Category (No Parent) --</option>
                  {parentCategories
                    .filter(p => !editingCategory || p.id !== editingCategory.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        📁 {p.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Category Type (Productivity / Value Allocation) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Value Allocation Group *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'productive', label: '🟢 Productive', desc: 'Work/Study' },
                    { id: 'neutral', label: '🔵 Neutral', desc: 'Rest/Social' },
                    { id: 'wasted', label: '🔴 Wasted', desc: 'Distraction' }
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => { sounds.playTap(); setFormCategoryType(t.id as any) }}
                      className={`p-2 rounded-xl text-left border transition ${
                        formCategoryType === t.id
                          ? 'border-violet-600 bg-violet-50/60 ring-2 ring-violet-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{t.label}</div>
                      <div className="text-[10px] text-slate-400">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormColor(c)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                      style={{ backgroundColor: c }}
                    >
                      {formColor === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto">
                  {Object.keys(ICON_MAP).map(iconKey => {
                    const IconComp = ICON_MAP[iconKey]
                    const isSelected = formIcon === iconKey
                    return (
                      <button
                        type="button"
                        key={iconKey}
                        onClick={() => setFormIcon(iconKey)}
                        className={`p-2 rounded-xl flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                        title={iconKey}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Seed Presets Confirmation ─────── */}
      {presetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 anim-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Load Preset Categories?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will seed 6 standard parent categories (Work, Study, Health, Finance, Leisure, Distraction) along with rich sub-categories.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPresetConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSeedPresets}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Loading...' : 'Load Presets'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
