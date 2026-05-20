import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "stats.json");

type StatsData = {
  totalRevenue: number;
  totalSales: number;
  totalLeads: number;
};

function readStats(): StatsData {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data) as StatsData;
}

function saveStats(data: StatsData) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function addLead() {
  const stats = readStats();
  stats.totalLeads += 1;
  saveStats(stats);
}

export function addSale() {
  const stats = readStats();
  stats.totalSales += 1;
  stats.totalRevenue += 20;
  saveStats(stats);
}
