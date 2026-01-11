export function SkeletonStatCard() {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl relative overflow-hidden shadow-sm dark:shadow-none">
            <div className="animate-pulse flex flex-col gap-4">
                {/* Icon & BG */}
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 opacity-20 absolute top-0 right-0 translate-x-1/3 -translate-y-1/3" />
                </div>

                {/* Value & Label */}
                <div className="space-y-2 mt-2">
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" /> {/* Value */}
                    <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded-md" /> {/* Label */}
                </div>
            </div>
        </div>
    );
}

export function SkeletonTable() {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Search & Actions Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
                {/* Header */}
                <div className="h-12 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 w-full mb-2" />

                {/* Rows */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                        {/* Cell 1: Avatar + Text */}
                        <div className="flex items-center gap-3 w-1/4">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                            <div className="space-y-2 w-full">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/50 rounded" />
                            </div>
                        </div>

                        {/* Cell 2 */}
                        <div className="w-1/4">
                            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>

                        {/* Cell 3 */}
                        <div className="w-1/4">
                            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                        </div>

                        {/* Cell 4 (Action) */}
                        <div className="w-1/4 flex justify-end">
                            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
