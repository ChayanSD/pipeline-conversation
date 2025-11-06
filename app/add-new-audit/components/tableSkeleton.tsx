import Skeleton from "react-loading-skeleton";

const tableSkeleton = () => {
  return (
    <div className="">
    {/* Header Skeleton */}
    <header className="">
      <div className="bg-white pt-5 flex items-center justify-center gap-2.5 w-full">
        <Skeleton 
          width={200} 
          height={24} 
          className="mb-0" 
          baseColor="#e5e7eb"
          highlightColor="#f3f4f6"
        />
        <div className="grid grid-cols-3 gap-[1.89px]">
          <Skeleton 
            width={120} 
            height={40} 
            className="rounded-tl-xl"
            baseColor="#fee2e2"
            highlightColor="#fef2f2"
          />
          <Skeleton 
            width={120} 
            height={40}
            baseColor="#fef3c7"
            highlightColor="#fffbeb"
          />
          <Skeleton 
            width={120} 
            height={40} 
            className="rounded-tr-xl"
            baseColor="#d1fae5"
            highlightColor="#ecfdf5"
          />
        </div>
      </div>
      <div className="px-24 flex items-center justify-between mt-4">
        <Skeleton 
          width={120} 
          height={28}
          baseColor="#e5e7eb"
          highlightColor="#f3f4f6"
        />
        <Skeleton 
          width={120} 
          height={28}
          baseColor="#e5e7eb"
          highlightColor="#f3f4f6"
        />
        <Skeleton 
          width={80} 
          height={28}
          baseColor="#e5e7eb"
          highlightColor="#f3f4f6"
        />
      </div>
    </header>

    {/* Main Content Skeleton */}
    <main className="px-24 pt-5 bg-white h-full pb-10">
      {/* Title and Buttons Row */}
      <div className="flex gap items-center justify-between mb-4">
        <div className="flex-1">
          <Skeleton 
            height={48} 
            className="rounded-xl"
            baseColor="#e5e7eb"
            highlightColor="#f3f4f6"
          />
        </div>
        <div className="w-px h-0 bg-transparent mx-7"></div>
        <div className="flex gap-3">
          <Skeleton 
            width={140} 
            height={48} 
            className="rounded-full"
            baseColor="#e5e7eb"
            highlightColor="#f3f4f6"
          />
          <Skeleton 
            width={200} 
            height={48} 
            className="rounded-full"
            baseColor="#fef3c7"
            highlightColor="#fef9c3"
          />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="mt-8">
        <div className="w-full border-collapse border border-gray-300">
          <div className="space-y-0">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex border-b border-gray-300">
                <div className="border-r border-gray-300 px-4 py-3 w-16 flex items-center justify-center">
                  <Skeleton width={20} height={20} circle />
                </div>
                <div className="border-r border-gray-300 px-4 py-3 flex-1">
                  <Skeleton 
                    height={40} 
                    className="rounded-xl"
                    baseColor="#e5e7eb"
                    highlightColor="#f3f4f6"
                  />
                </div>
                <div className="border-r border-gray-300 px-4 py-3 flex-1">
                  <div className="flex gap-2 items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton 
                        key={i} 
                        width={112} 
                        height={36} 
                        className="rounded-lg"
                        baseColor="#e5e7eb"
                        highlightColor="#f3f4f6"
                      />
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3 w-16 flex items-center justify-center">
                  <Skeleton width={20} height={20} circle />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};

export default tableSkeleton;