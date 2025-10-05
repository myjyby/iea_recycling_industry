import { 
  market_data, 
  competitiveness_data, 
  enablers_data,
  map_data,
} from '../load.mjs';
import * as small_multiples from '../render/small_multiples.mjs';
import * as dashboard_modules from '../render/dashboard_modules.mjs';

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

  function drawDashboard () {
    dashboard_modules.linechart(global_market_size, { container_selector: 'main.dashboard', title: 'Projections of the global market size' });
    dashboard_modules.linechart(top_10_recycling_rates, { container_selector: 'main.dashboard', title: 'Top 10 recycling rates trends', classname: 'span-1' });
    dashboard_modules.map(metal_recycling_facility, topodata, { container_selector: 'main.dashboard', title: 'Metal recycling facilities around the world', classname: 'span-3' });

    dashboard_modules.linechart(share_of_demand, { container_selector: 'main.dashboard', title: 'Projections of the share of demand' });
    dashboard_modules.bubblechart(top_10_investment_2024, { container_selector: 'main.dashboard', title: 'Top 10 investments in 2024' });
    dashboard_modules.piechart(paper_recycling_cost, { container_selector: 'main.dashboard', title: 'Paper recycling cost' });
  }

  drawDashboard();

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