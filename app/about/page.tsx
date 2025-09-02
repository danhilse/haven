export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Haven
            </a>
            <nav className="space-x-6">
              <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Home
              </a>
              <a href="/search" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                Search
              </a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            About Haven
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Answers at your fingertips, for every part of your mission.
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
          <div className="space-y-12">
            
            {/* What We Do */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                The quiet helper behind your busy days
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Whether it's a donor thank-you, a grant draft, or a policy update, we help you start strong and finish faster. Your board has questions, donors need updates, a report is due—we give you the words, tuned to your mission, ready in moments.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Never stare at a blank screen again. Haven provides ready-made guidance for the communication challenges nonprofits face every day.
              </p>
            </section>

            {/* How to Use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                How to use Haven
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Search by need</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Type what you're working on: "donor thank you letter" or "board meeting agenda." Find templates that understand your context.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Browse by category</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Explore organized sections: fundraising, volunteer management, grant writing, communications. Find patterns for common tasks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Adapt and use</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Copy templates to your favorite AI tool or use as starting points. Customize with your organization's voice and specific details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Build your rhythm</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Return for different challenges. Each template saves hours of writing, letting you focus on the mission instead of the busywork.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* What You Get */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                What you get
              </h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Consistent communication across staff and channels
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Rapid first drafts that save hours
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Donor, board, and volunteer messages that feel personal
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Expert-level help without needing an expert on staff
                </li>
              </ul>
            </section>

            {/* Getting Started */}
            <section className="bg-blue-50 dark:bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ready to get started?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The work is hard enough. Let us give you a head start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/search?semantic=true"
                  className="inline-flex items-center justify-center px-6 py-3 
                            bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                            transition-colors duration-200"
                >
                  Find your next answer
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 
                            bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                            text-gray-900 dark:text-gray-100 font-medium rounded-lg
                            transition-colors duration-200"
                >
                  Explore the library
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}