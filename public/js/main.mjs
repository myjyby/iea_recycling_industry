import { 
  market_data, 
  competitiveness_data, 
  enablers_data,
  map_data,
} from './load.mjs';
import * as small_multiples from './render/small_multiples.mjs';
import * as dashboard_modules from './render/dashboard_modules.mjs';

async function onLoad() {
  // const params = new URLSearchParams(document.location.search);
  // const doc = params.get("doc");

  const [ 
    global_market_size,
    market_status,
    share_of_demand,
  ] = await market_data();

  // small_multiples.share_of_demand(share_of_demand);
  // small_multiples.global_market_size(global_market_size);

  // console.log(global_market_size)
  // console.log(market_status)
  // console.log(share_of_demand)


  const [
    competitiveness_status,
    top_10_investment_2024,
    top_10_recycling_rates,
  ] = await competitiveness_data();

  // small_multiples.top_10_investment_2024(top_10_investment_2024);
  // small_multiples.top_10_recycling_rates(top_10_recycling_rates);
  // console.log(competitiveness_status)
  // console.log(top_10_investment_2024)
  // console.log(top_10_recycling_rates)

  const [
    metal_recycling_facility,
    paper_recycling_cost,    
  ] = await enablers_data();

  // console.log(metal_recycling_facility)
  // console.log(paper_recycling_cost)

  const topodata = await map_data();

  function drawDashboard () {
    dashboard_modules.linechart(global_market_size, { container_selector: 'main.dashboard', title: 'Global market size' });
    dashboard_modules.linechart(top_10_recycling_rates, { container_selector: 'main.dashboard', title: 'Top 10 recycling rates', classname: 'span-1' });
    dashboard_modules.map(metal_recycling_facility, topodata, { container_selector: 'main.dashboard', title: 'Metal recycling facilities', classname: 'span-3' });

    dashboard_modules.linechart(share_of_demand, { container_selector: 'main.dashboard', title: 'Share of demand' });
    dashboard_modules.bubblechart(top_10_investment_2024, { container_selector: 'main.dashboard', title: 'Top 10 investment in 2024' });
    dashboard_modules.piechart(paper_recycling_cost, { container_selector: 'main.dashboard', title: 'Paper recycling cost' });
  }
  // addEventListener('resize', (evt) => {
  //   drawDashboard();
  // });
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