import { 
  market_data, 
  competitiveness_data, 
  enablers_data,
  map_data,
} from '../load.mjs';
import * as sparklines from '../render/sparkline_inserts.mjs';

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

  // const topodata = await map_data();

  sparklines.init_sparklines({ 
    market_size: global_market_size, 
  });
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