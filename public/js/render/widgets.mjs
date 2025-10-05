import { d3_extended as d3 } from '../d3.extensions.mjs';
import { makeSafe } from '../helpers.mjs';

export const checklistDropdown = function (data, container, fn) {
  /* 
  Data needs to be formatted as:
    {
      key: str,
      values: [
        {
          key: str,
          value: str,
        }
      ]
    }
  */
  const chained = ['material', 'scenarios', 'type'];

  const list = container.addElem('div', `${data.key} checklist-dropdown widget`)
    .attr('tabindex', d3.selectAll('div.widget').size() + 101);
  list.addElem('button', 'anchor')
    .html(function () {
      const value = [...(new Set(data.values.map(d => d.key)))].toString();
      return `Select ${value}${chained.includes(value) ? ' <i class="fa fa-chain"></i>' : ''}`;
    }).on('click', function () {
      const sel = d3.select(this);
      sel.classed('active', !sel.classed('active'))
      const items = d3.select(sel.node().nextElementSibling)
      items.classed('hide', !items.classed('hide'))
    });
  const items = list.addElem('menu', 'items hide')
    .addElems('li', 'item', data.values.map(d => {
      let uuid = '';
      if (self?.crypto?.randomUUID()) uuid = self.crypto.randomUUID();
      else uuid = `cb-${makeSafe(data.key)}-${makeSafe(d.value)}`;
      return { ...d, uuid, fn };
    }));
  items.addElems('input')
    .attr('id', d => d.uuid)
    .attr('type', 'checkbox')
    .attr('checked', true)
    .attr('name', d => d.key)
    .attr('value', d => d.value)
  .on('change', function (evt, d) {
    // Return function
    const checked = this.checked;
    d3.selectAll(`input[name=${d.key}][value="${d.value}"]`)
    .each(function (c) {
      this.checked = checked;
      c.fn();
    });
    d.fn();
  });
  items.addElems('label')
    .attr('for', d => d.uuid)
    .html(d => d.value);
}

export const init_widgets = function (data, container, fn) {
  const widgets = []
  const sector_values = [...new Set(data.map(d => d.sector))].filter(d => d);
  if (sector_values.length) {
    widgets.push({
      key: 'sectors',
      values: sector_values.map(d => {
        return { key: 'sector', value: d };
      }),
    });
  }
  const material_values = [...new Set(data.map(d => d.material))].filter(d => d);
  if (material_values.length) {
  	widgets.push({
  		key: 'materials',
  		values: material_values.map(d => {
  			return { key: 'material', value: d };
  		}),
  	});
  }
  const type_values = [...new Set(data.map(d => d.type))].filter(d => d);
  if (type_values.length) {
  	widgets.push({
  		key: 'market status',
  		values: type_values.map(d => {
  			return { key: 'type', value: d };
  		}),
  	});
  }
  const priority_values = [...new Set(data.map(d => d['priority level']))].filter(d => d);
  if (priority_values.length) {
    widgets.push({
      key: 'priority level',
      values: priority_values.map(d => {
        return { key: 'priority level', value: d };
      }),
    });
  }
  const category_values = [...new Set(data.map(d => d.category))].filter(d => d);
  if (category_values.length) {
    widgets.push({
      key: 'category',
      values: category_values.map(d => {
        return { key: 'category', value: d };
      }),
    });
  }
  const country_values = [...new Set(data.map(d => d.country))].filter(d => d);
  if (country_values.length) {
    widgets.push({
      key: 'country',
      values: country_values.map(d => {
        return { key: 'country', value: d };
      }),
    });
  }
  const scenario_values = [...new Set(data.map(d => d.scenarios?.map(c => c.key)).flat())].filter(d => d);
	if (scenario_values.length > 1) {
    widgets.push({
  		key: 'scenario',
  		values: scenario_values.map(d => {
  			return { key: 'scenarios', value: d };
  		}),
  	});
  }
  widgets.forEach(w => {
    checklistDropdown(w, container, fn);
  });
}