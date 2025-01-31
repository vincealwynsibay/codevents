"use client";

import { differenceInSeconds } from "date-fns";
import { useEffect, useState } from "react";

export default function CountdownTimer({ destDate }: { destDate: string }) {
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimeRemaining = () => {
      const currentDate = new Date();
      setTimeRemaining(differenceInSeconds(destDate, currentDate));
    };

    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    updateTimeRemaining();

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [destDate]);

  useEffect(() => {
    // Convert seconds to hours, minutes, seconds
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    setTimer({ hours, minutes, seconds });
  }, [timeRemaining]);

  return (
    <div className="">
      {String(timer.hours).padStart(2, "0")}
      <span className="">:</span>
      {String(timer.minutes).padStart(2, "0")}
      <span className="">:</span>
      {String(timer.seconds).padStart(2, "0")}
    </div>
  );
}
