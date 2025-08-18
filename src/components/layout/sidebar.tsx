import Link from 'next/link'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[230px] bg-white border-r border-gray-200 shadow-sm">
      <div className="p-4">
        {/* 로고 영역 */}
        <div className="mb-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            지피티코리아
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
            href="/page1" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            Page1
          </Link>
          <Link 
            href="/page2" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            Page2
          </Link>
          <Link 
            href="/page3" 
            className="flex items-center py-2 px-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            Page3
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
        </nav>
      </div>
    </aside>
  )
}