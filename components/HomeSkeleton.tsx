import Skeleton from "react-loading-skeleton";

const HomeSkeleton = () => {
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
        <Skeleton 
          width={180} 
          height={48}
          className="rounded-full"
          baseColor="#fef3c7"
          highlightColor="#fef9c3"
        />
      </div>
    </div>

    {/* Table Skeleton */}
    <div className="border overflow-hidden">
      <div className="bg-gray-50 border-b">
        <div className="flex">
          <div className="px-6 py-4 border-r flex-1">
            <Skeleton 
              width={120} 
              height={20}
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
          </div>
          <div className="px-6 py-4 border-r flex-1">
            <Skeleton 
              width={120} 
              height={20}
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
          </div>
          <div className="px-6 py-4 border-r flex-1">
            <Skeleton 
              width={120} 
              height={20}
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
          </div>
          <div className="px-6 py-4 flex-1">
            <Skeleton 
              width={100} 
              height={20}
              baseColor="#e5e7eb"
              highlightColor="#f3f4f6"
            />
          </div>
        </div>
      </div>
      
      {/* Table Rows Skeleton */}
      <div className="bg-white">
        {Array.from({ length: 5 }).map((_, index) => (
          <div 
            key={index} 
            className="flex border-b border-[#E0E0E0]"
          >
            <div className="px-6 border-r py-4 flex-1">
              <Skeleton 
                width={200} 
                height={20}
                baseColor="#e5e7eb"
                highlightColor="#f3f4f6"
              />
            </div>
            <div className="px-6 border-r py-4 flex-1">
              <Skeleton 
                width={80} 
                height={20}
                baseColor="#e5e7eb"
                highlightColor="#f3f4f6"
              />
            </div>
            <div className="px-6 border-r py-4 flex-1">
              <Skeleton 
                width={50} 
                height={28}
                className="rounded"
                baseColor={index % 3 === 0 ? "#fee2e2" : index % 3 === 1 ? "#fed7aa" : "#d1fae5"}
                highlightColor={index % 3 === 0 ? "#fef2f2" : index % 3 === 1 ? "#fffbeb" : "#ecfdf5"}
              />
            </div>
            <div className="px-6 py-4 flex-1">
              <div className="flex gap-2">
                <Skeleton 
                  width={70} 
                  height={32}
                  className="rounded-md"
                  baseColor="#e5e7eb"
                  highlightColor="#f3f4f6"
                />
                <Skeleton 
                  width={75} 
                  height={32}
                  className="rounded-md"
                  baseColor="#fee2e2"
                  highlightColor="#fef2f2"
                />
                <Skeleton 
                  width={100} 
                  height={32}
                  className="rounded-md"
                  baseColor="#d1fae5"
                  highlightColor="#ecfdf5"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default HomeSkeleton;