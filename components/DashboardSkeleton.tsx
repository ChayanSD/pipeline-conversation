import Skeleton from "react-loading-skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="p-14 bg-white h-full">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <Skeleton 
              width={300} 
              height={40} 
              className="mb-2"
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
            <Skeleton 
              width={600} 
              height={24}
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <Skeleton 
                width={48} 
                height={48}
                className="rounded"
                baseColor="#e5e7eb"
                highlightColor="#f3f4f6"
              />
              <div className="ml-5 flex-1">
                <Skeleton 
                  width={120} 
                  height={20}
                  className="mb-2"
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
            </div>
          </div>
        ))}
      </div>

      {/* Invite Member Section Skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton 
            width={200} 
            height={28}
            baseColor="#e5e7eb"
            highlightColor="#f3f4f6"
          />
          <Skeleton 
            width={150} 
            height={40}
            className="rounded-full"
            baseColor="#e5e7eb"
            highlightColor="#f3f4f6"
          />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mb-6">
        <Skeleton 
          width={200} 
          height={32}
          className="mb-4"
          baseColor="#e5e7eb"
          highlightColor="#f3f4f6"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton 
              key={i}
              width="100%" 
              height={48}
              className="rounded-full"
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;

