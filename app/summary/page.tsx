"use client";
import React, { useRef, useState } from "react";
import { Image as ImageIcon, Type, RefreshCcw } from "lucide-react";

export default function SummaryPage() {
  const [selections, setSelections] = useState<Array<"text" | "image" | null>>([
    null,
    null,
    null,
  ]);
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [texts, setTexts] = useState<string[]>(["", "", ""]);
  const [bottomText, setBottomText] = useState<string>("");
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const openFilePicker = (index: number) => {
    setTimeout(() => {
      fileInputRefs.current[index]?.click();
    }, 50);
  };

  const handleImageChange = (
    index: number,
    file: File | null,
    target?: HTMLInputElement
  ) => {
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImages((prev) => {
        const next = [...prev];
        next[index] = imageUrl;
        return next;
      });
      setSelections((prev) => {
        const next = [...prev];
        next[index] = "image";
        return next;
      });
    } else {
    }

    if (target) target.value = "";
  };

  const handleSelect = (index: number, type: "text" | "image") => {
    if (type === "text") {
      setSelections((prev) => {
        const next = [...prev];
        next[index] = "text";
        return next;
      });
    } else {
      openFilePicker(index);
    }
  };

  const handleChangeOption = (index: number) => {
    const cur = selections[index];
    if (cur === "image") {
      setImages((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setSelections((prev) => {
        const next = [...prev];
        next[index] = "text";
        return next;
      });
    } else if (cur === "text") {
      openFilePicker(index);
    } else {
      openFilePicker(index);
    }
  };

  return (
    <div className="p-14 bg-white min-h-screen">
      <h1 className="text-[35px] leading-[39px] tracking-[0.21px] uppercase">
        Summary
      </h1>
      <main className="mt-4">
        <hr className="w-full border border-[#AAA] my-[18px]" />
        <div className="flex flex-wrap lg:flex-nowrap">
          {/* Left Side */}
          <div className="w-full lg:w-1/2 pr-0 lg:pr-10">
            <h1 className="text-[35px] leading-[39px] tracking-[0.21px] uppercase mb-9">
              IMPROVEMENT RECOMMENDATIONS
            </h1>
            <div className="flex flex-col">
              {[
                "Operational Efficiency",
                "Regulatory Compliance",
                "Customer Satisfaction",
                "Employee Training",
                "Technology Infrastructure",
                "Sustainability Initiatives",
              ].map((label, idx) => (
                <div className="mb-2" key={idx}>
                  <label className="block text-xl text-[#2B4055] tracking-[0.4px] mb-1">
                    {label}
                  </label>
                  <textarea
                    placeholder="Recommendation"
                    className="w-full h-24 p-2 text-xl text-[#2B4055] tracking-[0.4px] font-extralight border border-[#AAA] rounded-lg resize-none outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="hidden lg:block w-px h-[70vh] border border-[#AAA] my-[18px]" />

          {/* Right Side */}
          <div className="w-full lg:w-1/2 pl-0 lg:pl-10 mt-10 lg:mt-0">
            <h1 className="text-[35px] leading-[39px] tracking-[0.21px] uppercase">
              WHAT ARE THE NEXT STEPS?
            </h1>

            <div className="bg-[#EFEFEF] p-6 rounded-2xl mt-10">
              {/* Top Boxes */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`flex-1 relative rounded-lg border transition-all duration-200 overflow-hidden ${
                      selections[index]
                        ? "border border-[#2B4055]"
                        : "border border-[#CCC]"
                    } bg-[#E8E8E8]`}
                    style={{ aspectRatio: "1" }}
                  >
                    {/* IMAGE VIEW (only when we actually have an image URL) */}
                    {selections[index] === "image" && images[index] && (
                      <>
                        <img
                          src={images[index] || ""}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleChangeOption(index)}
                          className="absolute top-2 right-2 bg-[#2B4055] text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs"
                        >
                          <RefreshCcw className="w-3 h-3" /> Change
                        </button>
                      </>
                    )}

                    {/* TEXT VIEW */}
                    {selections[index] === "text" && (
                      <div className="absolute inset-0 flex flex-col">
                        <textarea
                          value={texts[index]}
                          onChange={(e) => {
                            const newTexts = [...texts];
                            newTexts[index] = e.target.value;
                            setTexts(newTexts);
                          }}
                          placeholder="Write your text..."
                          className="w-full h-full p-3 text-lg text-[#2B4055] font-extralight border-none outline-none resize-none bg-white"
                        />
                        <button
                          onClick={() => handleChangeOption(index)}
                          className="absolute top-2 right-2 bg-[#2B4055] text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs"
                        >
                          <RefreshCcw className="w-3 h-3" /> Change
                        </button>
                      </div>
                    )}

                    {/* DEFAULT CHOICE VIEW */}
                    {!selections[index] && (
                      <div className="relative w-full h-full">
                        {/* Image half */}
                        <div
                          className="absolute inset-0 bg-[#E8E8E8]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 0 100%)",
                          }}
                          onClick={() => handleSelect(index, "image")}
                        >
                          <div className="absolute top-1/4 left-28 -translate-x-1/3 -translate-y-1/2 flex items-center justify-center w-8 h-8">
                            <ImageIcon className="w-56 h-56 text-[#666]" />
                          </div>
                        </div>

                        <hr className="w-px h-[500px] border border-[#AAA] absolute rotate-45 top-1/2 left-[156px] -translate-x-1/3 -translate-y-1/2" />

                        {/* Text half */}
                        <div
                          className="absolute inset-0 bg-[#E8E8E8]"
                          style={{
                            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                          }}
                          onClick={() => handleSelect(index, "text")}
                        >
                          <div className="absolute bottom-1/4 right-28 translate-x-1/3 translate-y-1/2 flex items-center justify-center w-8 h-8">
                            <Type className="w-56 h-56 text-[#666]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => {
                        if (el) {
                          fileInputRefs.current[index] = el;
                        }
                      }}
                      onChange={(e) => {
                        const file =
                          e.target.files && e.target.files[0]
                            ? e.target.files[0]
                            : null;
                        handleImageChange(index, file, e.target);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <textarea
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Add overall next step details..."
                  className="w-full h-32 p-4 text-lg text-[#3b5163] border border-[#3b5163] rounded-lg resize-none outline-none bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-[#EFEFEF] p-5 rounded-2xl mt-10"></footer>
    </div>
  );
}
