import { d3_extended as d3 } from '../d3.extensions.mjs';
import { setupSVG } from './basics.mjs';

const years = new Array((2050-2015)+1).fill(0).map((d, i) => 2015 + i);
const current_year = new Date().getFullYear();

const padding = .25;

export const global_market_size = function (data) {
	const timescale = d3.scaleLinear()
		.domain(d3.extent(years));
	const yscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d.scenarios?.map(c => c.values.map(b => b.value))).flat(2)));
	const line = d3.line()
		.x(d => timescale(d.year))
		.y(d => yscale(d.value));

	const content = d3.select('section.content');
	const small_multiples = content.addElems('div', 'small-multiple global-market-size', data);
	small_multiples.addElems('div', 'linechart')
		.each(function (d) {
			const sel = d3.select(this);
			const { width, height, svg } = setupSVG(sel, 'market-size');

			timescale.range([width * padding / 2, width * (1 - padding / 2)]);
			yscale.range([height * (1 - padding / 2), height * padding / 2]);

			const gx = svg.append('g')
		    .attr('transform', `translate(${[0, height * (1 - padding / 2)]})`)
		    .call(d3.axisBottom(timescale).tickFormat(d3.format('d')))
	   	const gy = svg.append('g')
	      .attr('transform', `translate(${[width * padding / 2, 0]})`)
	      .call(d3.axisLeft(yscale));

			const groups = svg.addElems('g', 'scenario', d.scenarios)
			.each(function (d) {
				d3.select(this).classed(d.key, true);
			});
			
			groups.addElems('path', 'trend', d => {
				const { values } = d || {};
				const true_values = values.filter(c => c.year < current_year);
				const projected_values = values.filter(c => c.year >= current_year);
				if (true_values.length > 1) {
					return [
						{ type: 'true', values: true_values }, 
						{ type: 'projected', values: [true_values[true_values.length - 1], ...projected_values] },
					];
				} else return [{ type: 'projected', values }];
			}).each(function (d) {
				d3.select(this).classed(d.type, true);
			}).attr('d', d => line(d.values));

			groups.addElems('circle', 'point-value', d => {
				const { values } = d || {};
				values.forEach(c => {
					c.type = c.year <= current_year ? 'true' : 'projected';
				});
				return values
			}).each(function (d) {
				d3.select(this).classed(d.type, true);
			}).attr('cx', d => timescale(d.year))
			.attr('cy', d => yscale(d.value))
			.attr('r', 3);
		});
	small_multiples.addElems('p')
	.html(d => d.sector);
}

export const share_of_demand = function (data) {
	const timescale = d3.scaleLinear()
		.domain(d3.extent(years));
	const yscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d.scenarios?.map(c => c.values.map(b => b.value))).flat(2)));
	const line = d3.line()
		.x(d => timescale(d.year))
		.y(d => yscale(d.value));

	const content = d3.select('section.content');
	const small_multiples = content.addElems('div', 'small-multiple share-of-demand', data);
	small_multiples.addElems('div', 'linechart')
		.each(function (d) {
			const sel = d3.select(this).classed(d.material.toLowerCase(), true);
			const { width, height, svg } = setupSVG(sel, 'market-size');

			timescale.range([width * padding / 2, width * (1 - padding / 2)]);
			yscale.range([height * (1 - padding / 2), height * padding / 2]);

			const gx = svg.append('g')
		    .attr('transform', `translate(${[0, height * (1 - padding / 2)]})`)
		    .call(d3.axisBottom(timescale).tickFormat(d3.format('d')))
	   	const gy = svg.append('g')
	      .attr('transform', `translate(${[width * padding / 2, 0]})`)
	      .call(d3.axisLeft(yscale));

			const groups = svg.addElems('g', 'scenario', d.scenarios)
			.each(function (d) {
				d3.select(this).classed(d.key, true);
			});
			
			groups.addElems('path', 'trend', d => {
				const { values } = d || {};
				const true_values = values.filter(c => c.year < current_year);
				const projected_values = values.filter(c => c.year >= current_year);
				if (true_values.length > 1) {
					return [
						{ type: 'true', values: true_values }, 
						{ type: 'projected', values: [true_values[true_values.length - 1], ...projected_values] },
					];
				} else return [{ type: 'projected', values }];
			}).each(function (d) {
				d3.select(this).classed(d.type, true);
			}).attr('d', d => line(d.values));

			groups.addElems('circle', 'point-value', d => {
				const { values } = d || {};
				values.forEach(c => {
					c.type = c.year <= current_year ? 'true' : 'projected';
				});
				return values
			}).each(function (d) {
				d3.select(this)
					.classed(d.type, true);
			}).attr('cx', d => timescale(d.year))
			.attr('cy', d => yscale(d.value))
			.attr('r', 3);
		});
	small_multiples.addElems('p')
	.html(d => d.material)
}

export const top_10_investment_2024 = function (data) {
	const scale = d3.scaleLinear()
	.domain(d3.extent(data, d => d['investment allocated']))
	.range([5, 20]);

	const content = d3.select('section.content');
	const small_multiples = content.addElems('div', 'small-multiple top-10-investment-2024', [data]);
	small_multiples.addElems('div', 'bubblechart')
		.each(function (d) {
			const sel = d3.select(this);
			const { width, height, svg } = setupSVG(sel, 'market-size');

			const simu = d3.forceSimulation(d)
			  .force('charge', d3.forceManyBody().strength((d, i) => -width * 2 / 3).distanceMax(d => scale(d['investment allocated'])))
			  // .force('charge', d3.forceManyBody().distanceMax(d => scale(d['investment allocated'])))
			  .force('collide', d3.forceCollide().radius(d => scale(d['investment allocated'])).iterations(1))
			  .force('center', d3.forceCenter(width / 2, height / 2)) // Make this a function based on the group center
			  .force('x', d3.forceX().strength(0.01).x(c => width / 2))
			  .force('y', d3.forceY().strength(0.01).y(c => height / 2))
			  .stop()
			// This is for a static force layout
			// See example here: https://observablehq.com/@d3/static-force-directed-graph
			simu.tick(Math.ceil(Math.log(simu.alphaMin()) / Math.log(1 - simu.alphaDecay())));

			svg.addElems('circle', 'bubble', d)
			  .attr('cx', c => c.x)
			  .attr('cy', c => c.y)
			  .attr('r', c => scale(c['investment allocated']));
		});
	small_multiples.addElems('p')
	.html(d => d.material)
}

export const top_10_recycling_rates = function (data) {
  const timescale = d3.scaleLinear()
		.domain(d3.extent(years));
	const yscale = d3.scaleLinear()
		.domain(d3.extent(data.map(d => d.values?.map(c => c.value)).flat()));
	const line = d3.line()
		.x(d => timescale(d.year))
		.y(d => yscale(d.value));

	const content = d3.select('section.content');
	const small_multiples = content.addElems('div', 'small-multiple top-10-recycling-rates', data);
	small_multiples.addElems('div', 'linechart')
		.each(function (d) {
			const sel = d3.select(this).classed(d.material.toLowerCase(), true);
			const { width, height, svg } = setupSVG(sel, 'market-size');

			timescale.range([width * padding / 2, width * (1 - padding / 2)]);
			yscale.range([height * (1 - padding / 2), height * padding / 2]);

      const gx = svg.append('g')
        .attr('transform', `translate(${[0, height * (1 - padding / 2)]})`)
        .call(d3.axisBottom(timescale).tickFormat(d3.format('d')))
      const gy = svg.append('g')
        .attr('transform', `translate(${[width * padding / 2, 0]})`)
        .call(d3.axisLeft(yscale));
			
			svg.addElems('path', 'trend', d => {
				const { values } = d || {};
				const true_values = values.filter(c => c.year < current_year);
				const projected_values = values.filter(c => c.year >= current_year);
				if (true_values.length > 1) {
					return [
						{ type: 'true', values: true_values }, 
						{ type: 'projected', values: [true_values[true_values.length - 1], ...projected_values] },
					];
				} else return [{ type: 'projected', values }];
			}).each(function (d) {
				d3.select(this).classed(d.type, true);
			}).attr('d', d => line(d.values));

			svg.addElems('circle', 'point-value', d => {
				const { values } = d || {};
				values.forEach(c => {
					c.type = c.year <= current_year ? 'true' : 'projected';
				});
				return values
			}).each(function (d) {
				d3.select(this)
					.classed(d.type, true);
			}).attr('cx', d => timescale(d.year))
			.attr('cy', d => yscale(d.value))
			.attr('r', 3);
		});
	small_multiples.addElems('p')
	.html(d => d.material)
}