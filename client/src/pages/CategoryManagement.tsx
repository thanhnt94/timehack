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
import { renderAppIcon } from '../utils/iconHelper'

const PRESET_ICONS = [
  'folder', 'briefcase', 'code', 'book', 'activity', 'dumbbell',
  'heart', 'wallet', 'coffee', 'smile', 'clock', 'target', 'zap'
]

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
    return (categories || []).filter(c => !c.parent_id)
  }, [categories])

  const filteredParents = useMemo(() => {
    if (filterType === 'all') return parentCategories
    return parentCategories.filter(c => (c.category_type || 'productive') === filterType)
  }, [parentCategories, filterType])

  const productiveCount = useMemo(() => {
    return parentCategories.filter(c => (c.category_type || 'productive') === 'productive').length
  }, [parentCategories])

  const neutralCount = useMemo(() => {
    return parentCategories.filter(c => c.category_type === 'neutral').length
  }, [parentCategories])

  const wastedCount = useMemo(() => {
    return parentCategories.filter(c => c.category_type === 'wasted').length
  }, [parentCategories])

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

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'wasted':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            🔴 Wasted
          </span>
        )
      case 'neutral':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            🔵 Neutral
          </span>
        )
      case 'productive':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 Productive
          </span>
        )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-3 sm:px-6 sm:py-4 bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto space-y-3.5 pb-24">
        {/* ── Compact Top Action Header ─────── */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-violet-600" />
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Categories & Hierarchy
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Organize tasks, habits & time logs with value tags
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { sounds.playTap(); setPresetConfirmOpen(true) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition active:scale-95 cursor-pointer"
              title="Load standard preset categories"
            >
              <RotateCcw className="w-3.5 h-3.5 text-violet-600" />
              <span>Load Presets</span>
            </button>

            <button
              onClick={() => handleOpenAddModal(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {/* ── Filter Tabs Bar ─────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: 'all', label: `All (${parentCategories.length})` },
            { id: 'productive', label: `🟢 Productive (${productiveCount})` },
            { id: 'neutral', label: `🔵 Neutral (${neutralCount})` },
            { id: 'wasted', label: `🔴 Wasted (${wastedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.playTap(); setFilterType(tab.id as any) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Hierarchical Category Tree Cards ─────── */}
        {filteredParents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a new category or load standard presets to organize your activities.
            </p>
            <button
              onClick={() => handleSeedPresets()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Preset Categories</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredParents.map(parent => (
              <div
                key={parent.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:border-slate-300 transition"
              >
                {/* Parent Category Header Card */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: parent.color }}
                    >
                      {renderAppIcon(parent.icon, 'w-4 h-4 text-white')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {parent.name}
                        </span>
                        {getTypeBadge(parent.category_type)}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{parent.subcategories?.length || 0} sub-categories</span>
                        <span>•</span>
                        <span>{parent.tasks_count || 0} tasks</span>
                        <span>•</span>
                        <span>{Math.round(parent.focus_minutes || 0)}m focus</span>
                      </div>
                    </div>
                  </div>

                  {/* Parent Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenAddModal(parent.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition cursor-pointer active:scale-95"
                      title="Add sub-category"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Sub</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(parent)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer active:scale-90"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(parent.id, parent.name)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-90"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                {parent.subcategories && parent.subcategories.length > 0 ? (
                  <div className="p-2.5 bg-slate-50/50 space-y-1.5">
                    {parent.subcategories.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 hover:border-violet-200 transition shadow-2xs group"
                      >
                        <div className="flex items-center gap-2 min-w-0 pl-1">
                          <CornerDownRight className="w-3 h-3 text-slate-300 shrink-0" />
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: sub.color || parent.color }}
                          >
                            {renderAppIcon(sub.icon, 'w-3 h-3 text-white')}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <span>{sub.tasks_count || 0} tasks</span>
                              <span>•</span>
                              <span>{Math.round(sub.focus_minutes || 0)}m</span>
                            </div>
                          </div>
                        </div>

                        {/* Subcategory Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer active:scale-90"
                            title="Edit Subcategory"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(sub.id, sub.name)}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-90"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-slate-50/40 text-[10px] text-slate-400 italic flex items-center gap-1.5">
                    <span>No sub-categories yet. Click "+ Add Sub" to organize deeper.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: CREATE / EDIT CATEGORY ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  📁
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingCategory ? 'Edit Category' : formParentId ? 'New Sub-category' : 'New Category'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Deep Work, Learning, Workout..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-violet-500 transition"
                  autoFocus
                />
              </div>

              {/* Value / Productivity Type */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Productivity Value Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFormCategoryType('productive')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition cursor-pointer ${
                      formCategoryType === 'productive'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🟢 Productive
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategoryType('neutral')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition cursor-pointer ${
                      formCategoryType === 'neutral'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔵 Neutral
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategoryType('wasted')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition cursor-pointer ${
                      formCategoryType === 'wasted'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔴 Wasted
                  </button>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition cursor-pointer active:scale-90 ${
                        formColor === c ? 'ring-2 ring-violet-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formColor === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Presets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {PRESET_ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setFormIcon(ic)}
                      className={`h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                        formIcon === ic
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      {renderAppIcon(ic, 'w-3.5 h-3.5')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM PRESETS ── */}
      {presetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm anim-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Load Preset Categories?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will create standard categories (Coding, Fitness, Learning, Meetings, Entertainment) configured with proper value groups.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPresetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSeedPresets}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black shadow-md shadow-violet-600/30 transition cursor-pointer"
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
export default CategoryManagement
