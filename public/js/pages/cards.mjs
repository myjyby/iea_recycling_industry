import { 
  market_data, 
  competitiveness_data, 
  enablers_data,
  map_data,
} from '../load.mjs';
import * as card_pages from '../render/card_pages.mjs';

async function onLoad() {
  const [ 
    global_market_size,
    market_status,
    share_of_demand,
  ] = await market_data();
  const [
    competitiveness_status,
    top_10_investment_2024,
    top_10_recycling_rates,
  ] = await competitiveness_data();
  const [
    metal_recycling_facility,
    paper_recycling_cost,    
  ] = await enablers_data();

  const topodata = await map_data();

  const materials = [...new Set([
    ...share_of_demand.map(d => d.material), 
    ...top_10_investment_2024.map(d => d.material),
    ...top_10_recycling_rates.map(d => d.material),
  ])].filter(d => {
    return share_of_demand.some(c => c.material === d)
    && top_10_investment_2024.some(c => c.material === d)
    && top_10_recycling_rates.some(c => c.material === d)
    && d.toLowerCase() !== 'paper';
  });
  console.log(materials)

  card_pages.init_cards(materials, { data: [
    share_of_demand,
    top_10_investment_2024,
    top_10_recycling_rates,
  ] });

  // function drawDashboard () {
  //   dashboard_modules.linechart(global_market_size, { container_selector: 'main.dashboard', title: 'Global market size' });
  //   dashboard_modules.linechart(top_10_recycling_rates, { container_selector: 'main.dashboard', title: 'Top 10 recycling rates', classname: 'span-1' });
  //   dashboard_modules.map(metal_recycling_facility, topodata, { container_selector: 'main.dashboard', title: 'Metal recycling facilities', classname: 'span-3' });

  //   dashboard_modules.linechart(share_of_demand, { container_selector: 'main.dashboard', title: 'Share of demand' });
  //   dashboard_modules.bubblechart(top_10_investment_2024, { container_selector: 'main.dashboard', title: 'Top 10 investment in 2024' });
  //   dashboard_modules.piechart(paper_recycling_cost, { container_selector: 'main.dashboard', title: 'Paper recycling cost' });
  // }

  // drawDashboard();



}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    onLoad();
  });
} else {
  (async () => {
    await onLoad();
  })();
}