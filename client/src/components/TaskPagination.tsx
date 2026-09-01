import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, ArrowRight } from 'lucide-react'

export interface TaskPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function TaskPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: TaskPaginationProps) {
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false)
  const [targetPageInput, setTargetPageInput] = useState('')

  const handleOpenJump = () => {
    setTargetPageInput(String(currentPage))
    setIsJumpModalOpen(true)
  }

  const handleJumpSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const pageNum = parseInt(targetPageInput, 10)
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum)
      setIsJumpModalOpen(false)
    }
  }

  return (
    <>
      <div className={`flex items-center gap-1.5 shrink-0 select-none ${className}`}>
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:border-slate-200 shadow-2xs hover:border-violet-300 hover:text-violet-600 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center Clickable Page Badge */}
        <button
          onClick={handleOpenJump}
          className="px-3 h-8 rounded-xl bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 hover:border-violet-400 hover:shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 group shadow-2xs"
          title="Jump to page"
        >
          <span className="text-[11px] font-black text-slate-800 group-hover:text-violet-600 tracking-wider">
            {currentPage}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">/</span>
          <span className="text-[11px] font-bold text-slate-500">
            {Math.max(1, totalPages)}
          </span>
        </button>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:border-slate-200 shadow-2xs hover:border-violet-300 hover:text-violet-600 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Jump Page Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isJumpModalOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsJumpModalOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                className="w-full max-w-xs bg-white rounded-3xl shadow-2xl relative z-10 p-5 border border-slate-100 text-left flex flex-col gap-4 mx-auto"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">
                      Jump to Page
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      Total {totalPages} pages (1 - {totalPages})
                    </p>
                  </div>
                  <button
                    onClick={() => setIsJumpModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleJumpSubmit} className="space-y-3">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={targetPageInput}
                    onChange={(e) => setTargetPageInput(e.target.value)}
                    autoFocus
                    placeholder="Page number..."
                    className="w-full h-12 bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 text-lg font-black text-center text-violet-600 focus:border-violet-500 focus:bg-white outline-none transition"
                  />

                  {totalPages > 2 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetPageInput('1')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                      >
                        Page 1
                      </button>
                      {totalPages > 4 && (
                        <button
                          type="button"
                          onClick={() => setTargetPageInput(String(Math.ceil(totalPages / 2)))}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                        >
                          Page {Math.ceil(totalPages / 2)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setTargetPageInput(String(totalPages))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold cursor-pointer"
                      >
                        Page {totalPages}
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-10 rounded-xl bg-violet-600 text-white font-black text-xs shadow-xs shadow-violet-200 hover:bg-violet-700 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Go to Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
