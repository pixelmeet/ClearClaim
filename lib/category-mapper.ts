export type ReceiptCategory =
  | "food_dining" | "groceries" | "transportation" | "accommodation"
  | "entertainment" | "shopping" | "health_medical" | "utilities" | "fuel" | "other";

const KEYWORDS: Record<ReceiptCategory, string[]> = {
  food_dining: [
    "restaurant", "cafe", "coffee", "starbucks", "mcdonald", "burger", "pizza", "sushi",
    "kfc", "subway", "domino", "bistro", "grill", "diner", "bar", "pub", "brewery",
    "zomato", "swiggy", "doordash", "ubereats", "grubhub", "deliveroo", "bakery",
    "dessert", "ice cream", "noodle", "ramen", "taco", "kebab", "shawarma", "canteen",
  ],
  groceries: [
    "walmart", "tesco", "aldi", "lidl", "kroger", "whole foods", "trader joe", "safeway",
    "costco", "spar", "reliance fresh", "dmart", "bigbasket", "grofers", "grocery",
    "supermarket", "hypermarket", "provision", "fresh mart", "food bazaar",
  ],
  transportation: [
    "uber", "lyft", "ola", "grab", "taxi", "cab", "bus", "train", "metro", "subway",
    "airline", "flight", "airways", "airport", "amtrak", "bolt", "rapido", "parking",
    "toll", "transit", "railway", "irctc", "redbus", "makemytrip flights",
  ],
  accommodation: [
    "hotel", "inn", "airbnb", "hostel", "motel", "resort", "lodging", "marriott",
    "hilton", "hyatt", "oyo", "booking.com", "expedia", "trivago", "bed and breakfast",
  ],
  entertainment: [
    "cinema", "theatre", "netflix", "spotify", "amazon prime", "disney", "hulu", "steam",
    "playstation", "xbox", "concert", "event", "museum", "zoo", "amusement", "pvr",
    "inox", "amc", "regal", "bookmyshow", "ticketmaster", "gaming",
  ],
  shopping: [
    "amazon", "flipkart", "ebay", "myntra", "zara", "h&m", "nike", "adidas", "apple store",
    "mall", "department", "clothing", "fashion", "electronics", "furniture", "ikea",
    "target", "best buy", "decathlon", "marks & spencer", "meesho", "nykaa",
  ],
  health_medical: [
    "pharmacy", "chemist", "clinic", "hospital", "doctor", "dental", "dentist", "medical",
    "health", "cvs", "walgreens", "boots", "apollo", "1mg", "netmeds", "lab", "diagnostic",
    "optician", "physiotherapy", "medplus", "wellness",
  ],
  utilities: [
    "electricity", "power board", "water bill", "gas bill", "internet", "broadband",
    "airtel", "jio", "vodafone", "vi ", "at&t", "verizon", "t-mobile", "comcast",
    "spectrum", "phone bill", "wifi", "cable tv", "bsnl", "tata sky",
  ],
  fuel: [
    "petrol", "diesel", "bp ", "shell", "exxon", "chevron", "indian oil", "iocl",
    "bharat petroleum", "bpcl", "hp petrol", "hpcl", "fuel", "gas station",
    "filling station", "ev charge", "tesla supercharger", "charge point",
  ],
  other: [],
};

export function detectCategory(
  aiCategory: string | null | undefined,
  merchant?: string | null,
  description?: string | null
): ReceiptCategory {
  const VALID = new Set<ReceiptCategory>([
    "food_dining", "groceries", "transportation", "accommodation",
    "entertainment", "shopping", "health_medical", "utilities", "fuel", "other",
  ]);

  if (aiCategory && VALID.has(aiCategory as ReceiptCategory)) {
    return aiCategory as ReceiptCategory;
  }

  const text = `${merchant ?? ""} ${description ?? ""}`.toLowerCase();
  let best: ReceiptCategory = "other";
  let bestScore = 0;

  for (const [cat, kws] of Object.entries(KEYWORDS) as [ReceiptCategory, string[]][]) {
    if (cat === "other") continue;
    const score = kws.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }

  return best;
}
