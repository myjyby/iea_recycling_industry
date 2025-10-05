import { d3_extended as d3 } from '../d3.extensions.mjs';
import { setupSVG, padding } from './basics.mjs';
import { makeSafe } from '../helpers.mjs';
import { init_widgets } from './widgets.mjs';

const years = new Array((2050-2015)+1).fill(0).map((d, i) => 2015 + i);
const current_year = new Date().getFullYear();

export const linechart = function (data, kwargs) {
  let { container_selector, title, classname } = kwargs || {};

	const container = d3.select(container_selector || 'main.dashboard');
	const chart_module = container.addElems('div', `module ${makeSafe(title)}${classname ? ` ${classname}` : ''}`, [data]);
  chart_module.addElems('div', 'title')
  .addElems('h2')
  .html(title || 'Missing title')

  // Set up widget data and modules
  const widget_container = chart_module.addElems('div', 'widget-container');
  init_widgets(data, widget_container, render);

  // Set up the canvas
  const canvas = chart_module.addElems('div', 'chart');
  const { width, height, svg } = setupSVG(canvas, 'linechart');

  // Define the render function
	function render () {
    let data = chart_module.data()[0];
    
    // Filter data based on dropdowns
    const visible_features = {};
    [...chart_module.selectAll('.widget.checklist-dropdown input:checked').nodes()]
    .forEach(function (el) {
      const { name: key, value } = el || {};
      if (visible_features[key]) visible_features[key].push(value);
      else visible_features[key] = [value];
    });
    data = data.filter(d => {
      return Object.keys(visible_features).length 
      && Object.keys(visible_features).filter(k => k !== 'scenarios')
      .every(k => {
        return visible_features[k].includes(d[k]);
      });
    });

    const timescale = d3.scaleLinear()
      // .domain(d3.extent(years))
      .domain(d3.extent(data.map(d => d.scenarios?.map(c => c.values.map(b => b.year))).flat(2)))
      .range([width * padding / 2, width * (1 - padding * 1.5)]);
    const yscale = d3.scaleLinear()
      .domain([
        0, 
        d3.max(data.map(d => {
          return d.scenarios?.filter(c => {
            if (visible_features.scenarios?.length) return visible_features.scenarios.includes(c.key);
            else return true;
          }).map(c => c.values.map(b => b.value))
        }).flat(2))
      ])
      .range([height * (1 - padding), height * padding / 2]);
    const line = d3.line()
      .x(d => timescale(d.year))
      .y(d => yscale(d.value));

    const groups = svg.addElems('g', 'group highlight', data)
    .on('mouseover', function () {
      const sel = d3.select(this).moveToFront();
      svg.selectAll('g.group')
        .classed('highlight', false);
      sel.classed('highlight', true);
    }).on('mouseout', function () {
      svg.selectAll('g.group')
        .classed('highlight', true);
    }).addElems('g', 'scenario', d => {
      return d.scenarios.filter(c => {
        if (visible_features.scenarios?.length) return visible_features.scenarios?.includes(c.key);
        else return c;
      });
    });
    groups.addElems('path', 'trend', d => {
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

    groups.addElems('circle', 'point-value', d => {
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
    .each( function (d) {
      const sel = d3.select(this);
      if (!sel.attr('cy')) {
        sel.attr('cy', yscale(d.value))
        .attr('r', 0);
      }
    }).transition()
      .attr('cy', d => yscale(d.value))
      .attr('r', 3);

    groups.addElems('text', 'label', d => {
      const { key, label, values } = d || {};
      const maxyear = d3.max(values, c => c.year);
      const { year, value } = values.find(c => c.year === maxyear);
      const num_scenarios = d3.max(data, c => c.scenarios.length)
      return [{ x: timescale(year), y: yscale(value), label: num_scenarios > 1 ? `${label}-${key}` : label }];
    }).attr('x', d => d.x + 6)
      .attr('y', d => d.y)
      .attr('dy', '.3em')
      .text(d => d.label)
    .each(function () {
      const parent = d3.select(this.parentNode);
      const { width, height, x, y } = this.getBBox();
      parent.insertElems('text.label', 'rect', 'label-bg')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height);
    });

    const gx = svg.addElems('g', 'x-axis')
      .attr('transform', `translate(${[0, height * (1 - padding)]})`)
      .call(d3.axisBottom(timescale).ticks(5).tickFormat(d3.format('d')))
    
    const unit = [...new Set(data.map(d => d.unit))][0];
    const gy = svg.addElems('g', 'y-axis')
      .attr('transform', `translate(${[width * padding / 2, 0]})`)
    gy.addElem('text', 'label')
      .attr('y', height * padding / 4)
      .attr('dy', '.3em')
      .text(unit)
    gy.transition().call(d3.axisLeft(yscale).ticks(5));
		
    // Add the legend
    const legend_data = [...new Set(data.map(d => d.scenarios.map(c => c.values.map(b => b.type))).flat(3))]
    .map(d => {
      return [
        { type: d, pos: 0 },
        { type: d, pos: 10 },
      ];
    });
    const legend = svg.addElems('g', 'legend', [legend_data])
      .attr('transform', `translate(${[0, height * (1 - padding * .25)]})`);
    const legend_item = legend.addElems('g', 'legend-item', d => d)
      .attr('transform', (d, i) => `translate(${[i * width / (legend_data.length + 2) + 3, 0]})`)
    legend_item.addElems('line')
    .each(function (d) {
      d3.select(this).classed(d[0].type, true);
    }).attr('x1', d => d[0].pos)
      .attr('x2', d => d[1].pos)
      .attr('y1', d => 0)
      .attr('y2', d => 0);
    legend_item.addElems('circle', 'point-value', d => d)
    .each(function (d) {
      d3.select(this).classed(d.type, true);
    }).attr('cx', d => d.pos)
      .attr('r', 3);
    legend_item.addElems('text', 'label')
      .attr('transform', d => {
        return `translate(${[d3.max(d, c => c.pos) + 10, 0]})`
      }).attr('dy', '.3em')
      .text(d => d[0].type === 'true' ? 'Known values' : 'Projected values');
	}
  render();

  // Add the notes
  const notes = [...new Set(data.map(d => d.notes))];
  if (notes.length) {
    chart_module.addElems('div', 'notes', [notes.filter(d => d?.length).join('\n\n')])
    .addElems('p', 'note')
      .attr('title', d => d)
      .html(d => d?.length > 100 ? `${d.slice(0, 100)}…` : d);
  }
}

export const bubblechart = function (data, kwargs) {
  let { container_selector, title, classname } = kwargs || {};

  const container = d3.select(container_selector || 'main.dashboard');
  const chart_module = container.addElems('div', `module ${makeSafe(title)}${classname ? ` ${classname}` : ''}`, [data]);
  chart_module.addElems('div', 'title')
  .addElems('h2')
  .html(title || 'Missing title')

  // Set up widget data and modules
  const widget_container = chart_module.addElems('div', 'widget-container');
  init_widgets(data, widget_container, render);

  // Set up the canvas
  const canvas = chart_module.addElems('div', 'chart');
  const { width, height, svg } = setupSVG(canvas, 'bubblechart');

  // Define the render function
  function render () {
    let data = chart_module.data()[0];
    
    // Filter data based on dropdowns
    const visible_features = {};
    [...chart_module.selectAll('.widget.checklist-dropdown input:checked').nodes()]
    .forEach(function (el) {
      const { name: key, value } = el || {};
      if (visible_features[key]) visible_features[key].push(value);
      else visible_features[key] = [value];
    });
    data = data.filter(d => {
      return Object.keys(visible_features).length 
      && Object.keys(visible_features).filter(k => k !== 'scenarios')
      .every(k => {
        return visible_features[k].includes(d[k]);
      });
    });
    data.sort((a, b) => a.value - b.value);

    const scale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([0, 75]);

    // Draw the bubbles
    const simu = d3.forceSimulation(data)
      .force('charge', d3.forceManyBody().distanceMax(d => scale(d.value)))
      .force('collide', d3.forceCollide().radius(d => scale(d.value)).iterations(3))
      .force('center', d3.forceCenter(width * .5, height * .4)) // Make this a function based on the group center
      .force('x', d3.forceX().strength(0.01).x(c => width * .5))
      .force('y', d3.forceY().strength(0.01).y(c => height * .4))
      .on('tick', ontick);

    const unit = [...new Set(data.map(d => d.unit))][0];

    const bubbles = svg.addElems('g', 'bubble', data, d => makeSafe(d.material))
    .each(function (d) {
      // d3.select(this).classed(d.material?.toLowerCase(), true);
    });
    bubbles.addElems('circle').attr('r', d => scale(d.value));
    bubbles.addElems('text', 'value')
      .attr('dy', '.3em')
      .text(d => d.value);
    bubbles.filter(d => d.value === d3.max(data, c => c.value))
    .addElems('text', 'unit')
      .attr('dy', '.3em')
      .attr('y', 12 * 1.25)
      .text(unit);
    bubbles.addElems('line', 'connector')
      .attr('x1', d => d.x >= 0 ? scale(d.value) + 10 : -scale(d.value) - 10)
      .attr('x2', d => d.x >= 0 ? scale(d.value) : -scale(d.value))
      .attr('y1', 0)
      .attr('y2', 0);
    bubbles.addElems('text', 'label')
      .attr('x', d => d.x >= 0 ? scale(d.value) + 15 : -scale(d.value) - 15)
      .attr('dy', '.3em')
      .style('text-anchor', d => d.x >= 0 ? 'start' : 'end')
      .text(d => d.label);

    function ontick () {
      bubbles.attr('transform', d => `translate(${[d.x, d.y]})`);
    }

    // TO DO: ADD LEGEND
  }
  render();

  // Add the notes
  const notes = [...new Set(data.map(d => d.notes))];
  if (notes.length) {
    chart_module.addElems('div', 'notes', [notes.filter(d => d?.length).join('\n\n')])
    .addElems('p', 'note')
      .attr('title', d => d)
      .html(d => d?.length > 100 ? `${d.slice(0, 100)}…` : d);
  }
}

export const piechart = function (data, kwargs) {
  let { container_selector, title, classname } = kwargs || {};

  const container = d3.select(container_selector || 'main.dashboard');
  const chart_module = container.addElems('div', `module ${makeSafe(title)}${classname ? ` ${classname}` : ''}`, [data]);
  chart_module.addElems('div', 'title')
  .addElems('h2')
  .html(title || 'Missing title')

  // Set up widget data and modules
  const widget_container = chart_module.addElems('div', 'widget-container');
  init_widgets(data, widget_container, render);

  // Set up the canvas
  const canvas = chart_module.addElems('div', 'chart');
  const { width, height, svg } = setupSVG(canvas, 'piechart');

  // Define the render function
  function render () {
    let data = chart_module.data()[0];
    
    // Filter data based on dropdowns
    const visible_features = {};
    [...chart_module.selectAll('.widget.checklist-dropdown input:checked').nodes()]
    .forEach(function (el) {
      const { name: key, value } = el || {};
      if (visible_features[key]) visible_features[key].push(value);
      else visible_features[key] = [value];
    });
    data = data.filter(d => {
      return Object.keys(visible_features).length 
      && Object.keys(visible_features).filter(k => k !== 'scenarios')
      .every(k => {
        return visible_features[k].includes(d[k]);
      });
    });
    data.sort((a, b) => a.value - b.value);

    const radius = Math.min(width, height) / 4;
    const outer_radius = Math.min(width, height) * (1 - padding);
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius - 1);
    const outer_arc = d3.arc()
      .innerRadius(0)
      .outerRadius(outer_radius);
    const pie = d3.pie()
      // .padAngle(1 / radius)
      .value(d => d.value);
    function midAngle (startAngle, endAngle) {
      return startAngle + (endAngle - startAngle)/2;
    }

    const slice = svg.addElems('g', 'pie')
      .attr('transform', `translate(${[width / 2, height / 2]})`)
    .addElems('g', 'slice', pie(data), d => d.data.category);
    slice.addElems('path')
      .transition()
      .attr('d', arc);
    slice.addElems('text', 'value')
      .attr('transform', d => `translate(${outer_arc.centroid(d)})`)
      .style('text-anchor', d => {
        const { startAngle, endAngle } = d || {};
        const mid = midAngle(startAngle, endAngle);
        if (Math.round(midAngle(startAngle, endAngle) % Math.PI) === 3) return 'start';
        else if (mid < Math.PI) return 'start';
        else return 'end';
      }).addElems('tspan', null, d => {
        let { label } = d?.data || {};
        if (label.length > 50) label = label.split('&').map((c, j) => j !== 0 ? `& ${c}` : c);
        else label = [label];
        return label.concat([`(${d.data.singular_note})`, `- ${d.data.display_value} ${d.data.units[0]}`]).map(c => {
          return { 
            label: c,
            pos: outer_arc.centroid(d)[1] >= 0 ? 1 : -1,
            bold: label.includes(c),
          };
        });
      }).attr('x', 0)
        .attr('y', (d, i, n) => `${d.pos === -1 ? -(n.length - 2) * 1.25 + i * 1.25 : i * 1.25}em`)
        .style('font-weight', d => d.bold ? 'bold' : null)
      .text(d => {
        return d.label.trim();
      });

      // .addElems('tspan', null, d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value)))
      //   .attr('x', 3)
      //   .attr('y', (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
      //   .attr('fill-opacity', (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
      //   .text(d => capitalize(d));


    // TO DO: ADD LEGEND
  }
  render();

  // Add the notes
  const notes = [...new Set(data.map(d => d.notes))];
  if (notes.length) {
    chart_module.addElems('div', 'notes', [notes.filter(d => d?.length).join('\n\n')])
    .addElems('p', 'note')
      .attr('title', d => d)
      .html(d => d?.length > 150 ? `${d.slice(0, 150)}…` : d);
  }
}

export const map = async function (data, topodata, kwargs) {
  const [
    landmass,
    countries,
  ] = topodata || [];
  // Load the map data
  const landtopo = topojson.feature(landmass, landmass.objects.landmass);

  let { container_selector, title, classname } = kwargs || {};

  const container = d3.select(container_selector || 'main.dashboard');
  const chart_module = container.addElems('div', `module ${makeSafe(title)}${classname ? ` ${classname}` : ''}`, [data]);
  chart_module.addElems('div', 'title')
  .addElems('h2')
  .html(title || 'Missing title')

  // Set up widget data and modules
  const widget_container = chart_module.addElems('div', 'widget-container');
  init_widgets(data, widget_container, render);

  // Set up the canvas
  const canvas = chart_module.addElems('div', 'chart');
  const { width, height, svg } = setupSVG(canvas, 'map');

  async function render () {
    let data = chart_module.data()[0];
    
    // Filter data based on dropdowns
    const visible_features = {};
    [...chart_module.selectAll('.widget.checklist-dropdown input:checked').nodes()]
    .forEach(function (el) {
      const { name: key, value } = el || {};
      if (visible_features[key]) visible_features[key].push(value);
      else visible_features[key] = [value];
    });
    data = data.filter(d => {
      return Object.keys(visible_features).length 
      && Object.keys(visible_features).filter(k => k !== 'scenarios')
      .every(k => {
        return visible_features[k].includes(d[k]);
      });
    });

    const countrytopo = topojson.feature(countries, countries.objects.countries);
    // TO DO: Filter the countries
    
    const scale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([0, 20]);

    // console.log(data)

    const proj = d3.geoMercator()
    .fitExtent([
      [0, 0],
      [width, height]
    ], countrytopo);

    const path = d3.geoPath(proj);
    
    svg.addElems('g', 'basemap')
    .addElems('path', 'outline', landtopo.features)
    .transition()
      .attr('d', path);
    svg.addElems('g', 'country')
    .addElems('path', 'outline', countrytopo.features)
    .transition()
      .attr('d', path);
    svg.addElems('g', 'overlay')
    .addElems('circle', 'dot', data, d => d.iso3)
      .attr('transform', d => `translate(${proj([d.lng, d.lat])})`)
    .transition()
      .attr('r', d => scale(d.value));

    // Add the legend
    console.log(data)
    const legend_data = d3.extent(data, d => d.value).map((d, i) => {
        return { pos: i * scale(d3.max(scale.domain())) * 2, value: d };
    });

    const legend = svg.addElems('g', 'legend', [legend_data])
      .attr('transform', `translate(${[width * padding * .25, height - scale(d3.max(scale.domain())) - 1]})`);
      // .attr('transform', `translate(${[0, height]})`)
    legend.addElems('line')
      .attr('x1', d => d[0].pos)
      .attr('x2', d => d[1].pos)
      .attr('y1', d => 0)
      .attr('y2', d => 0);
    legend.addElems('circle', 'dot', d => d)
      .attr('cx', d => d.pos)
      .attr('r', d => scale(d.value));
    legend.addElems('text', 'label centered', d => d)
      .attr('x', d => d.pos)
      .attr('y', d => -scale(d.value) - 5)
      .text(d => d.value)
  }
  render();

  // Add the notes
  const notes = [...new Set(data.map(d => d.notes))];
  if (notes.length) {
    chart_module.addElems('div', 'notes', [notes.filter(d => d?.length).join('\n\n')])
    .addElems('p', 'note')
      .attr('title', d => d)
      .html(d => d?.length > 150 ? `${d.slice(0, 150)}…` : d);
  }
}