import { d3_extended as d3 } from './d3.extensions.mjs';

export const market_data = async function () {
  const promises = [
    d3.csv('../public/data/market/global_market_size.csv'),
    d3.csv('../public/data/market/market_status.csv'),
    d3.csv('../public/data/market/share_of_demand.csv'),
  ];
  let [ 
    global_market_size,
    market_status,
    share_of_demand,
  ] = await Promise.all(promises);
  // Process the data
  global_market_size = global_market_size.map(d => {
    const { 
      sector,
      '2024': baseline, 
      '2035.A': A1, 
      '2050.A': A2, 
      '2035.B': B1, 
      '2050.B': B2, 
      ...rest
    } = d || {};
    const scenarios = [
      { key: 'A', label: sector, values: [
        { year: 2024, value: +baseline }, 
        { year: 2035, value: +A1 },
        { year: 2050, value: +A2 },
      ]},
      { key: 'B', label: sector, values: [
        { year: 2024, value: +baseline },
        { year: 2035, value: +B1 },
        { year: 2050, value: +B2 },
      ]},
    ];
    return { ...rest, sector, scenarios, unit: 'Billion $' };
  });

  share_of_demand = share_of_demand.map(d => {
    const {
      material,
      '2020': baseline_2020,
      '2024': baseline_2024,
      '2035': A1,
      '2050': A2,
      '2035 (NZE)': B1,
      '2050 (NZE)': B2,
      ...rest
    } = d || {};
    const scenarios = [
      { key: 'A', label: material, values: [
        { year: 2020, value: +baseline_2020.replace('%', '') },
        { year: 2024, value: +baseline_2024.replace('%', '') },
        { year: 2035, value: +A1.replace('%', '') },
        { year: 2050, value: +A2.replace('%', '') },
      ]},
      { key: 'B', label: material, values: [
        { year: 2020, value: +baseline_2020.replace('%', '') },
        { year: 2024, value: +baseline_2024.replace('%', '') },
        { year: 2035, value: +B1.replace('%', '') },
        { year: 2050, value: +B2.replace('%', ''), note: 'NZE' },
      ]},
    ];
    return { ...rest, material, scenarios, unit: '%' };
  });

  return [
    global_market_size,
    market_status,
    share_of_demand,
  ];
}

export const competitiveness_data = async function () {
  const promises = [
    d3.csv('../public/data/competitiveness/competitiveness_status.csv'),
    d3.csv('../public/data/competitiveness/top_10_investment_2024.csv'),
    d3.csv('../public/data/competitiveness/top_10_recycling_rates_interpreted.csv'),
  ];
  let [
    competitiveness_status,
    top_10_investment_2024,
    top_10_recycling_rates,
  ] = await Promise.all(promises);

  top_10_investment_2024 = top_10_investment_2024.map(d => {
    let { 
      'Investment Allocated (Billion $)': value,
      material,
      ...rest
    } = d || {};
    material = material.replace('*', '');
    return { ...rest, material, label: material, value: +value, unit: 'Billion $', year: 2024 }
  });

  top_10_recycling_rates = top_10_recycling_rates.map(d => {
    let { 
      '2015': baseline_2015,
      '2024': baseline_2024,
      material,
      ...rest
    } = d || {};
    const scenarios = [
      { key: 'A', label: material, values: [
        { year: 2015, value: +baseline_2015.replace('%', '') },
        { year: 2024, value: +baseline_2024.replace('%', '') },
      ]},
    ];
    material = material.replace('*', '');
    return { ...rest, material, scenarios, unit: '%' };
  });

  return [
    competitiveness_status,
    top_10_investment_2024,
    top_10_recycling_rates,
  ];
}

export const enablers_data = async function () {
  const promises = [
    d3.csv('../public/data/enablers/metal_recycling_facility.csv'),
    d3.csv('../public/data/enablers/paper_recycling_cost.csv'),
  ];
  let [
    metal_recycling_facility,
    paper_recycling_cost, 
  ] = await Promise.all(promises);

  metal_recycling_facility = metal_recycling_facility.map(d => {
    const {
      'Recycling Facilities per million': value,
      Latitude: lat,
      Longitude: lng,
      ...rest
    } = d || {};
    return { ...rest, value: +value, lat: +lat, lng: +lng, unit: 'per million' }
  });

  paper_recycling_cost = paper_recycling_cost.map(d => {
    const {
      'percentage of total cost': value,
      'cost per ton (EUR)': display_value,
      'cost category': category,
      ...rest
    } = d || {};
    return { ...rest, category, label: category, display_value: +display_value, value: +value?.replace('%', ''), units: ['euros per ton', 'percentage of total cost'] };
  });

  return [
    metal_recycling_facility,
    paper_recycling_cost,
  ];
}

export const map_data = async function () {
  const promises = [
    d3.json('../public/data/geo/landmass.topojson'),
    d3.json('../public/data/geo/countries.topojson'),
  ];
  return await Promise.all(promises);
}