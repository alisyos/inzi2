import Link from 'next/link'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[230px] bg-white border-r border-gray-200 shadow-sm">
      <div className="p-4">
        {/* 로고 영역 */}
        <div className="mb-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            인지컨트롤스
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="space-y-1">
          <Link 
            href="/" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/advance-payments" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors font-medium"
          >
            선수선급금 관리
          </Link>
          <Link 
            href="/project-analysis" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors font-medium"
          >
            프로젝트별 분석
          </Link>
          <Link 
            href="/manager-analysis" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors font-medium"
          >
            담당자별 분석
          </Link>
        </nav>
      </div>
    </aside>
  )
}