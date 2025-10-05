import { d3_extended as d3 } from '../d3.extensions.mjs';
import { setupSVG, padding } from './basics.mjs';
import { makeSafe, nest } from '../helpers.mjs';

export const init_sparklines = function (kwargs = {}) {
  const spans = d3.selectAll('span.sparkline')
  .each(function () {
    const sel = d3.select(this);
    let { source, type, params } = this.dataset || {};
    if (params?.length) params = JSON.parse(params) || {};
    
    const data_source = kwargs[source];
    const xrange = d3.extent(data_source.map(d => d.scenarios?.map(c => c.values.map(b => b.year))).flat(2));
    const yrange = d3.extent(data_source.map(d => d.scenarios?.map(c => c.values.map(b => b.value))).flat(2));
    const data = kwargs[source].filter(d => {
      return Object.keys(params).some(k => {
        if (k !== 'scenario') return d[k] === params[k];
        else return false;
      });
    }).map(d => {
      let { scenarios, ...rest } = d || {};
      if (params.scenario) {
        if (Array.isArray(params.scenario)) scenarios = scenarios.filter(c => params.scenario.includes(c.key));
        else scenarios = scenarios.filter(c => params.scenario === c.key);
      }
      return { scenarios, ...rest };
    });
    // console.log(data)

    drawLine(sel, data, xrange, yrange);

  })
}

function drawLine (canvas, data, xrange, yrange) {
  const { width, height, svg } = setupSVG(canvas, 'linechart');
  
  const current_year = new Date().getFullYear();
  const timescale = d3.scaleLinear()
    .domain(xrange)
    .range([width * padding / 2, width * (1 - padding / 2)]);
  const yscale = d3.scaleLinear()
    .domain(yrange)
    .range([height * (1 - padding), height * padding / 2]);
  const line = d3.line()
    .x(d => timescale(d.year))
    .y(d => yscale(d.value));

  const group = svg.addElems('g', 'group', data.map(d => d.scenarios))
  .addElems('g', null, d => d)
  group.addElems('path', 'trend', d => {
    const { values } = d || {};
    if (values?.length) {
      const true_values = values?.filter(c => c.year < current_year);
      const projected_values = values?.filter(c => c.year >= current_year);
      if (true_values.length > 1) {
        return [
          { type: 'true', values: true_values }, 
          { type: 'projected', values: [true_values[true_values.length - 1], ...projected_values] },
        ];
      } else return [{ type: 'projected', values }];
    } else return [];
  }).each(function (d) {
   d3.select(this).classed(d.type, true);
  }).transition()
  .attr('d', d => line(d.values));

  group.addElems('circle', 'point-value', d => {
    const { values } = d || {};
    if (values?.length) {
      values.forEach(c => {
        c.type = c.year <= current_year ? 'true' : 'projected';
      });
      return values;
    } else return [];
  }).each(function (d) {
    d3.select(this).classed(d.type, true);
  }).attr('cx', d => timescale(d.year))
    .attr('cy', d => yscale(d.value))
    .attr('r', 3);

  svg.addElems('path', 'axis')
    .attr('d', `M${[width * padding / 2, height * padding / 2]} L${[width * padding / 2, height * (1 - padding / 2)]} L${[width * (1 - padding / 2), height * (1 - padding / 2)]}`)
}