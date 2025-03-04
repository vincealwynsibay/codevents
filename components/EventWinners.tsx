import { Participant } from "@/types/types";
import { RefObject } from "react";

export default function EventWinners({
  winners,
  ref,
}: {
  winners:
    | {
        winner1: Participant;
        winner2: Participant;
        winner3: Participant;
      }
    | undefined;

  ref: RefObject<HTMLDivElement | null>;
}) {
  if (!winners) return null;
  return (
    <div className="mt-8">
      <div
        className="flex flex-col gap-4 mx-8 font-chakra rounded-lg border-white border-[1px] p-10 "
        ref={ref}
      >
        <h2 className="text-2xl">WINNERS</h2>
        {!winners.winner1 && !winners.winner2 && !winners.winner3 ? (
          <h3 className="text-2xl text-center">NO WINNERS</h3>
        ) : (
          <div className="grid grid-cols-[1fr,_1fr,_1fr] w-full justify-between mt-8">
            <div className="text-center flex flex-col gap-4">
              <h3 className="text-3xl">
                {winners.winner1 && winners.winner1.name}
              </h3>
              <span className="text-xl">🥇 1ST</span>
            </div>
            <div className="text-center flex flex-col gap-4">
              <h3 className="text-3xl">
                {winners.winner2 && winners.winner2.name}
              </h3>
              <span className="text-xl">🥈 2ND</span>
            </div>
            <div className="text-center flex flex-col gap-4">
              <h3 className="text-3xl">
                {winners.winner3 && winners.winner3.name}
              </h3>
              <span className="text-xl">🥉 3RD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
