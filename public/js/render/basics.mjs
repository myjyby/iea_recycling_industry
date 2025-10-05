import { d3_extended as d3 } from '../d3.extensions.mjs';

export const setupSVG = function (node, classname) {
  const {
    clientWidth: cw,
    clientHeight: ch,
    offsetWidth: ow,
    offsetHeight: oh,
  } = node.node();
  const width = cw ?? ow;
  const height = ch ?? oh;

  const svg = node.addElems('svg', classname)
    .attr('x', 0)
    .attr('y', 0)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  return { width, height, svg };
}

export const padding = .25;
