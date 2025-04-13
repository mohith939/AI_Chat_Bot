"use client";

export default function ChatSkeleton() {
  return (
    <div className="animate-pulse">
      {/* User message skeleton */}
      <div className="py-4">
        <div className="max-w-3xl mx-auto px-4 flex">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 mr-4 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* AI message skeleton */}
      <div className="py-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-3xl mx-auto px-4 flex">
          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 mr-4 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* User message skeleton */}
      <div className="py-4">
        <div className="max-w-3xl mx-auto px-4 flex">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 mr-4 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
