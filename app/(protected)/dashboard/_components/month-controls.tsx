"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

type AlertType = 'ALL' | 'PAYMENT' | 'INQUIRY' | 'ROUTE_CHANGE';

type MonthControlsProps = {
  year: number;
  month: number;
  minYear: number;
  minMonth: number;
  maxYear: number;
  maxMonth: number;
  typeParam: AlertType;
  basePath?: string;
};

const OUT_OF_RANGE_MESSAGE = '조회할 수 없는 기간입니다.';

function isBeforeMin(year: number, month: number, minYear: number, minMonth: number) {
  return year < minYear || (year === minYear && month < minMonth);
}

function isAfterMax(year: number, month: number, maxYear: number, maxMonth: number) {
  return year > maxYear || (year === maxYear && month > maxMonth);
}

function showOutOfRange() {
  void Swal.fire({
    icon: 'info',
    title: OUT_OF_RANGE_MESSAGE,
    toast: true,
    position: 'center',
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
    showClass: {
      popup: 'ui-toast-show'
    },
    hideClass: {
      popup: 'ui-toast-hide'
    }
  });
}

export function MonthControls({
  year,
  month,
  minYear,
  minMonth,
  maxYear,
  maxMonth,
  typeParam,
  basePath = '/dashboard'
}: MonthControlsProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(month);

  useEffect(() => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, [year, month]);

  const yearOptions = useMemo(() => {
    const ys = [];
    for (let y = minYear; y <= maxYear; y += 1) ys.push(y);
    return ys.length ? ys : [year];
  }, [minYear, maxYear, year]);

  const monthOptions = useMemo(() => {
    const start = selectedYear === minYear ? minMonth : 1;
    const end = selectedYear === maxYear ? maxMonth : 12;
    const ms = [];
    for (let m = start; m <= end; m += 1) ms.push(m);
    return ms.length ? ms : [month];
  }, [selectedYear, minYear, minMonth, maxYear, maxMonth, month]);

  const goTo = (nextYear: number, nextMonth: number) => {
    if (isBeforeMin(nextYear, nextMonth, minYear, minMonth) || isAfterMax(nextYear, nextMonth, maxYear, maxMonth)) {
      showOutOfRange();
      return;
    }
    router.push(`${basePath}?year=${nextYear}&month=${nextMonth}&atype=${typeParam}`);
  };

  const handlePrev = () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    goTo(prevYear, prevMonth);
  };

  const handleNext = () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    goTo(nextYear, nextMonth);
  };

  const handleYearChange = (value: number) => {
    setSelectedYear(value);
    const minForYear = value === minYear ? minMonth : 1;
    const maxForYear = value === maxYear ? maxMonth : 12;
    if (selectedMonth < minForYear) {
      setSelectedMonth(minForYear);
    } else if (selectedMonth > maxForYear) {
      setSelectedMonth(maxForYear);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBeforeMin(selectedYear, selectedMonth, minYear, minMonth) || isAfterMax(selectedYear, selectedMonth, maxYear, maxMonth)) {
      showOutOfRange();
      return;
    }
    goTo(selectedYear, selectedMonth);
  };

  return (
    <div className="flex items-center gap-2 text-base">
      <button
        type="button"
        onClick={handlePrev}
        className="ui-btn-outline border-slate-300 shadow-sm hover:border-amber-300 hover:bg-amber-50/60"
      >
        이전 월
      </button>
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <input type="hidden" name="atype" value={typeParam} />
        <select
          name="year"
          value={selectedYear}
          onChange={(event) => handleYearChange(Number(event.target.value))}
          className="ui-select w-auto py-1.5"
        >
          {yearOptions.map((yy) => (
            <option key={yy} value={yy}>{yy}년</option>
          ))}
        </select>
        <select
          name="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(Number(event.target.value))}
          className="ui-select w-auto py-1.5"
        >
          {monthOptions.map((mm) => (
            <option key={mm} value={mm}>{mm}월</option>
          ))}
        </select>
        <button className="ui-btn-outline border-amber-300 bg-amber-50 py-1.5 text-amber-700">조회</button>
      </form>
      <button
        type="button"
        onClick={handleNext}
        className="ui-btn-outline border-slate-300 shadow-sm hover:border-amber-300 hover:bg-amber-50/60"
      >
        다음 월
      </button>
    </div>
  );
}
