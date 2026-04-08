export function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const native = new Date(s);
  if (!isNaN(native.getTime()) && native.getFullYear() > 1970) {
    return toISO(native);
  }

  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y;
    const date = new Date(`${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (!isNaN(date.getTime())) return toISO(date);
  }

  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  };

  const textDate = s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{2,4})|([A-Za-z]{3,9})\s+(\d{1,2})[,\s]+(\d{2,4})/i);
  if (textDate) {
    let day: string, mon: string, year: string;
    if (textDate[1]) {
      day = textDate[1]; mon = textDate[2]; year = textDate[3];
    } else {
      mon = textDate[4]; day = textDate[5]; year = textDate[6];
    }
    const m = months[mon.slice(0, 3).toLowerCase()];
    if (m) {
      const y = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
      const date = new Date(`${y}-${m}-${day.padStart(2, "0")}`);
      if (!isNaN(date.getTime())) return toISO(date);
    }
  }

  if (/^\d{10}$/.test(s)) return toISO(new Date(parseInt(s) * 1000));
  if (/^\d{13}$/.test(s)) return toISO(new Date(parseInt(s)));

  return null;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}
