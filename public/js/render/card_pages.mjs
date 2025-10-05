import { d3_extended as d3 } from '../d3.extensions.mjs';
import { setupSVG, padding } from './basics.mjs';
import { makeSafe, nest } from '../helpers.mjs';

export const init_cards = function (materials, kwargs) {
  const { data } = kwargs || {};
  const [ 
    share_of_demand,
    top_10_investment_2024,
    top_10_recycling_rates,
  ] = data || [];

  const main = d3.select('main');

  const card = main.addElems('section', 'card', materials)
  .each(function (d) {
    d3.select(this).classed(d.toLowerCase(), true);
  });
  // Add the main image
  card.addElems('img')
    .attr('src', d => `../public/imgs/${d.toLowerCase()}.svg`);

  const container = card.addElems('div', 'container');
  
  container.addElem('div', 'content')
  .each(function () {
    const sel = d3.select(this);
    const canvas = sel.addElems('div', 'canvas investment')
    const { width: w } = canvas.node().getBoundingClientRect();

    const investment_scale = d3.scaleLinear()
      .domain([0, d3.max(top_10_investment_2024, d => d.value)])
      .range([0, w * (1 - padding) / 2]);

    const { width, height, svg } = setupSVG(canvas, 'bubblechart');
    const bubbles = svg.addElems('g', 'bubble', d => {
      return top_10_investment_2024.filter(c => c.material === d);
    }, d => makeSafe(d.material))
      .attr('transform', `translate(${[width / 2, height / 2]})`)
    .each(function (d) {
      // d3.select(this).classed(d.material?.toLowerCase(), true);
    });
    bubbles.addElems('circle').attr('r', d => investment_scale(d.value));
    bubbles.addElems('text', 'value')
      .attr('dy', '.3em')
      .attr('y', -6 * 1.25)
      .text(d => d.value);
    bubbles.addElems('text', 'unit')
      .attr('dy', '.3em')
      .attr('y', 6 * 1.25)
      .text(d => d.unit);
    bubbles.addElems('text', 'description')
      .attr('transform', d => `translate(${[0, investment_scale(d.value) + 12 * 1.5]})`)
      .text('investmented in 2024.');
  });

  // Add title/ name of the element
  container.addElem('div', 'content')
  .addElems('div', 'title')
  .addElems('h1')
    .html(d => d)

  container.addElem('div', 'content flex')
  .each(function (d) {
    const sel = d3.select(this);
    const demand_canvas = sel.addElems('div', 'canvas demand');

    const demand_data = share_of_demand.find(c => c.material === d);
    const { width, height, svg: demand_svg } = setupSVG(demand_canvas, 'chronopie');

    // Process the data
    let scenarios = demand_data.scenarios.map(c => {
      return c.values.map(b => { return { key: c.key, ...b } })
    }).flat();
    scenarios.forEach(c => {
      if (c.year < new Date().getFullYear()) c.index = 0;
      else if (c.key === 'A') c.index = 1;
      else if (c.key === 'B') c.index = -1;
    });
    scenarios = [...new Map(scenarios.reverse().map(item => {
      return [`${item['year']}-${item['value']}`, item]
    })).values()];
    // Make sure the years are sorted (although this should also be handled by the timescale below)
    scenarios.sort((a, b) => a.year - b. year);
    // Fill in the missing values for the rest of the % and for the pie chart to work
    scenarios = scenarios.map(d => {
      const { value: percentage, ...rest } = d;
      const restpercentage = 100 - percentage;
      return {
        ...rest, 
        values: [
          { value: restpercentage, category: 'rest' },
          { value: percentage, category: 'focus'  },
        ],
      };
    });

    const years = [...new Set(scenarios.map(c => c.year))]
    const x_steps = years.length + 1;
    const y_steps = [...new Set(scenarios.map(c => c.index))].length + 1;

    const timescale = d3.scaleLinear()
      .domain(d3.extent(scenarios, c => c.year))
      .range([width * padding / 2, width * (1 - padding)]);
      // .range([0, width]);
    const ypos = d3.scaleLinear()
      .domain(d3.extent(scenarios.map(c => c.index / 2.5)))
      // .range([width * padding / 2, width * (1 - padding * 1.5)]);
      .range([-(height / 2) * (padding / 2), (height / 2) * (padding / 2)]);

    const radius = Math.min(width / x_steps, height / y_steps) / 2;
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius - 1);
    const pie = d3.pie()
      .sort((a, b) => a.category.localeCompare(b.category))
      .value(d => d.value);

    const g = demand_svg.addElems('g', 'pies', [scenarios])
      .attr('transform', `translate(${[0, height / 2]})`);
    g.addElems('path', 'scenario', c => nest.call(c, { key: 'key' }))
      .attr('d', c => {
        if (c.key === 'A') return `M${c.values.map(b => [timescale(b.year), ypos(b.index)]).join(' L')}`;
        else return `M${[timescale(years[years.indexOf(c.values[0].year) - 1]), ypos(0)]} ${c.values.map(b => [timescale(b.year), ypos(b.index)]).join(' L')}`;
      })
    const slice = g.addElems('g', 'pie', c => c)
      .attr('transform', c => `translate(${[timescale(c.year), ypos(c.index)]})`)
    .addElems('g', 'slice', c => pie(c.values), c => c.data.category)
    .each(function (c) {
      d3.select(this).classed(c.data.category, true);
    });
    slice.addElems('path')
      .transition()
      .attr('d', arc);
    slice.addElems('text', 'value')
      .attr('transform', c => `translate(${arc.centroid(c)})`)
      .text(c => c.data.display_value);
    g.addElems('text', 'scenario-label', c => {
      return d3.extent(scenarios, b => b.index)
      .map(b => { 
        return { key: c.find(a => a.index === b)?.key, index: b } 
      });
    }).attr('transform', c => {
      return `translate(${[timescale(d3.max(timescale.domain())) + radius + 5, ypos(c.index)]})`
    }).text(c => `scenario-${c.key}`);

    demand_svg.addElems('text', 'tick', years)
      .attr('transform', c => `translate(${[timescale(c), height * (1 - padding / 2)]})`)
      .text(c => c);

    demand_svg.addElems('text', 'description')
      .attr('transform', d => `translate(${[width / 2, height]})`)
      .attr('dy', '-.3em')
      .text('Two scenarios for the evolution of the share of demand by 2050.');
  })
	
}