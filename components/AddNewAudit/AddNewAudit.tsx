import Image from "next/image";
import React from "react";
import AuditTable from "@/components/AuditTable/AuditTable";

export default function AddNewAudit() {
  return (
    <div className="">
      <header className="">
        <div className=" flex items-center justify-center gap-2.5 max-w-7xl mx-auto ">
          <p className="text-[17px] uppercase font-500 tracking-[0.352px] leading-normal font-medium">GRADING SCALE (1-5)</p>
          <div className="grid grid-cols-3 gap-[1.89px]">
            <p className="w-full text-[17px] uppercase font-medium bg-[#F65355] px-[38px] py-[10px] text-white rounded-tl-xl">
              1-2 URGENT ATTEN
            </p>
            <p className="w-full text-[17px] uppercase font-medium bg-[#F7AF41] px-[38px] py-[10px] text-white ">
              3-4 AVERAGE AUDIT
            </p>
            <p className="w-full text-[17px] uppercase font-medium bg-[#209150] px-[38px] py-[10px] text-white rounded-tr-xl">
              5 EXELLENT AUDIT
            </p>
          </div>
        </div>
          <div
          className="w-full relative z-10"
          style={{
            backgroundImage: "url(/bg-img.png)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 bottom-0 -z-10"
            style={{
              backgroundColor: "rgba(10, 155, 255, 0.3)",
              pointerEvents: "none",
            }}
          />
          <div className="px-24 flex items-center justify-between">
            {["questions", "answers", "score"].map((item,i) => (
                <p key={i} className={`text-[22px] text-white capitalize font-500 tracking-[0.352px] leading-normal font-medium ${i === 1 ? "ml-56":""}`}>
                  {item}
                </p>
            ))}
          </div>
        </div>
      </header>
      <main className="px-24 mt-5">
        <div className="flex gap items-center justify-between">
          <div className="flex-1">
            <input type="text" placeholder="Presntaton Name" className="w-full bg-[#4569871A]  text-[22px] px-8 py-[18px] border border-[#3b5163] rounded-[12px] outline-none" />
          </div>
          <div className="w-px h-[30px] bg-[#3b5163] mx-7"></div>
          <div className="flex gap-4">
            <button className="px-[26px] py-[18px] bg-[#CECECE] hover:bg-[#CECECE]/80 transition-all duration-300 rounded-full text-[22px] tracking-[0.352px] leading-normal cursor-pointer">Back to List</button>
            <button className="px-[26px] w-[266px] py-[18px] bg-[#F7AF41] hover:bg-[#F7AF41]/80 transition-all duration-300 rounded-full text-[22px] tracking-[0.352px] leading-normal cursor-pointer">Create Audit</button>
          </div>
        </div>
        <AuditTable />
      </main>
    </div>
  );
}
