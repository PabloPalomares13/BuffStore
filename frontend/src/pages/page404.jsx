import React from "react";

const Page404 = () =>{
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#f9f9f9] relative flex items-center justify-center text-center font-sans">
      {/* Número 404 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[10rem] text-[7rem] text-[#3C86FC] font-bold tracking-[2rem] leading-none select-none z-10">
        4 4
      </div>

      {/* Mensaje "You seem lost." */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[1rem] text-2xl font-bold text-center text-[hsl(217,97%,61%)] font-serif select-none">
        You seem lost.
      </div>

      {/* Mensaje secundario */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[7rem] text-[1rem] text-[#222] font-sans">
        The page you are trying to reach doesn't exist.
      </div>

      {/* Cabeza */}
      <div className="relative w-[5.1rem] h-[5.1rem] rounded-full bg-[hsl(217,97%,61%)] z-0 shadow-[0_0_0_2rem_hsla(217,97%,61%,0.1),0_0_0_4rem_hsla(217,97%,61%,0.05),0_0_0_6rem_hsla(217,97%,61%,0.025)] flex items-center justify-center">
        {/* Boca */}
        <div className="absolute bottom-[1.2rem] w-[1.1rem] h-[0.5rem] rounded-t-[4rem] bg-[#ED6B5F] shadow-[0_-0.3rem_0_0.3rem_#222]"></div>

        {/* Ojos */}
        <div className="absolute top-[0.2rem] w-[5.1rem] h-[2rem] flex justify-start items-start overflow-hidden">
          <div className="w-[0.3rem] h-[0.3rem] bg-[#222] rounded-full mt-[1.6rem] ml-[1.6rem] shadow-[0_0_0_0.3rem_white,1.4rem_-0.2rem_0_#222,1.5rem_0_0_0.3rem_white]"></div>
        </div>
      </div>
    </div>
  );
}

export default Page404;