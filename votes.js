"use strict";

dc.config.defaultColors(d3.schemeTableau10);
const mapChart = new dc.GeoChoroplethChart("#map-chart");
const majorityChart = new dc.PieChart("#majority-chart");
const fluctuationChart = new dc.BarChart("#fluctuation-chart");
const topCountriesChart = new dc.RowChart("#top-countries-chart");
const bottomCountriesChart = new dc.RowChart("#bottom-countries-chart");
const issueChart = new dc.RowChart("#issue-chart");
const voteChart = new dc.BarChart("#yearly-vote-chart");
const volumeChart = new dc.BarChart("#yearly-volume-chart");
const resCount = new dc.DataCount(".dc-data-count");
const resTable = new dc.DataTable(".dc-data-table");
const importantBox = new dc.CboxMenu("#important-box");
const amendBox = new dc.CboxMenu("#amend-box");
const paraBox = new dc.CboxMenu("#para-box");
const opts = {
  lines: 9,
  length: 9,
  width: 5,
  radius: 14,
  color: "#EE3124",
  speed: 1.9,
  trail: 40,
  className: "spinner",
};
const mapChartSpinner = new Spinner(opts).spin(
  document.getElementById("map-chart")
);
const majorityChartSpinner = new Spinner(opts).spin(
  document.getElementById("majority-chart")
);
const fluctuationChartSpinner = new Spinner(opts).spin(
  document.getElementById("fluctuation-chart")
);
const topCountriesChartSpinner = new Spinner(opts).spin(
  document.getElementById("top-countries-chart")
);
const bottomCountriesChartSpinner = new Spinner(opts).spin(
  document.getElementById("bottom-countries-chart")
);
const issueChartSpinner = new Spinner(opts).spin(
  document.getElementById("issue-chart")
);
const voteChartSpinner = new Spinner(opts).spin(
  document.getElementById("yearly-vote-chart")
);
const volumeChartSpinner = new Spinner(opts).spin(
  document.getElementById("yearly-volume-chart")
);
const importantBoxSpinner = new Spinner(opts).spin(
  document.getElementById("important-box")
);
const amendBoxSpinner = new Spinner(opts).spin(
  document.getElementById("amend-box")
);
const paraBoxSpinner = new Spinner(opts).spin(
  document.getElementById("para-box")
);
const defaultCountry = "FRA";

d3.csv("data/countries.csv").then((countries) => {
  const ccodes = countries.map((c) => c.ccode);
  const ccodeToCountry = countries.reduce((map, obj) => {
    map[obj.ccode] = obj.Country;
    return map;
  }, {});
  const ccodeToCountryname = countries.reduce((map, obj) => {
    map[obj.ccode] = obj.Countryname;
    return map;
  }, {});
  const countryToCcode = countries.reduce((map, obj) => {
    map[obj.Country] = obj.ccode;
    return map;
  }, {});
  const countryToCountryname = countries.reduce((map, obj) => {
    map[obj.Country] = obj.Countryname;
    return map;
  }, {});

  let majorityChartFilters = null;
  let fluctuationChartFilters = null;
  let topCountriesChartFilters = null;
  let bottomCountriesChartFilters = null;
  let issueChartFilters = null;
  let voteChartFilters = null;
  let volumeChartFilters = null;
  let resCountFilters = null;
  let resTableFilters = null;
  let importantBoxFilters = null;
  let amendBoxFilters = null;
  let paraBoxFilters = null;

  d3.json("data/countries.geojson").then((mapJson) => {
    function selectCountry(country) {
      const currentCcode = countryToCcode[country];
      const otherCcodes = ccodes.filter((i) => i !== currentCcode);

      mapChartSpinner.spin(document.getElementById("map-chart"));
      majorityChartSpinner.spin(document.getElementById("majority-chart"));
      fluctuationChartSpinner.spin(
        document.getElementById("fluctuation-chart")
      );
      topCountriesChartSpinner.spin(
        document.getElementById("top-countries-chart")
      );
      bottomCountriesChartSpinner.spin(
        document.getElementById("bottom-countries-chart")
      );
      issueChartSpinner.spin(document.getElementById("issue-chart"));
      voteChartSpinner.spin(document.getElementById("yearly-vote-chart"));
      volumeChartSpinner.spin(document.getElementById("yearly-volume-chart"));
      importantBoxSpinner.spin(document.getElementById("important-box"));
      amendBoxSpinner.spin(document.getElementById("amend-box"));
      paraBoxSpinner.spin(document.getElementById("para-box"));
      document.getElementById(
        "country-info"
      ).textContent = ` [${countryToCountryname[country]}]`;

      d3.csv(`data/${currentCcode}.csv`).then((data) => {
        const dateFormatSpecifier = "%Y-%m-%d";
        const dateFormat = d3.timeFormat(dateFormatSpecifier);
        const dateFormatParser = d3.timeParse(dateFormatSpecifier);
        const numberFormat = d3.format(".2f");

        function regroup(dim, cols) {
          const _groupAll = dim.groupAll().reduce(
            (p, v) => {
              // add
              cols.forEach((c) => {
                const val = +v[c];
                if (val != 0) {
                  p[c].count++;
                  p[c].total += val;
                  p[c].avg = p[c].total / p[c].count;
                }
              });
              return p;
            },
            (p, v) => {
              // remove
              cols.forEach((c) => {
                const val = +v[c];
                if (val != 0) {
                  p[c].count--;
                  p[c].total -= val;
                  p[c].avg = p[c].count ? p[c].total / p[c].count : 0;
                }
              });
              return p;
            },
            () => {
              // init
              let p = {};
              cols.forEach((c) => {
                p[c] = {
                  total: 0,
                  count: 0,
                  avg: 0,
                };
              });
              return p;
            }
          );
          return {
            all: () => {
              return d3
                .map(_groupAll.value())
                .entries()
                .filter((e) => e.value.count > 0);
            },
          };
        }

        data.forEach((d) => {
          d.dd = dateFormatParser(d.date);
          d.year = d3.timeYear(d.dd); // pre-calculate year for better performance
          d.no = +d.no; // coerce to number
          d.yes = +d.yes; // coerce to number
          d.abstain = +d.abstain; // coerce to number
        });

        const ndx = crossfilter(data);
        const all = ndx.groupAll();

        // Dimension by full date
        const dateDimension = ndx.dimension((d) => d.dd);
        const similarityGroup = regroup(dateDimension, otherCcodes);

        // Dimension by year
        const yearDimension = ndx.dimension((d) => d.year);
        const volumeByYearGroup = yearDimension.group().reduceSum((d) => 1);

        const importantDimension = ndx.dimension((d) => d.importantvote);
        const amendDimension = ndx.dimension((d) => d.amend);
        const paraDimension = ndx.dimension((d) => d.para);

        function convertBooleanToString(val) {
          switch (+val) {
            case 0:
              return "No";
            case 1:
              return "Yes";
            default:
              return "N/A";
          }
        }

        // Important Box

        importantBoxSpinner.stop();
        importantBox
          .dimension(importantDimension)
          .group(importantDimension.group())
          .title((d) => convertBooleanToString(d.key))
          .multiple(false)
          .controlsUseVisibility(true);

        // Amendment Box

        amendBoxSpinner.stop();
        amendBox
          .dimension(amendDimension)
          .group(amendDimension.group())
          .title((d) => convertBooleanToString(d.key))
          .multiple(false)
          .controlsUseVisibility(true);

        // Paragraph Box

        paraBoxSpinner.stop();
        paraBox
          .dimension(paraDimension)
          .group(paraDimension.group())
          .title((d) => convertBooleanToString(d.key))
          .multiple(false)
          .controlsUseVisibility(true);

        // Majority Chart

        const majorityDimension = ndx.dimension((d) => {
          const vote = +d[currentCcode];
          if (vote === 2) return "Abstain";
          else if (vote !== 1 && vote !== 3) return "Absent";
          else if (d.yes > d.no) return vote === 3 ? "Disagree" : "Agree";
          else return vote === 1 ? "Disagree" : "Agree";
        });
        const majorityGroup = majorityDimension.group();
        majorityChartSpinner.stop();
        majorityChart
          .width(140)
          .height(150)
          .radius(90)
          .dimension(majorityDimension)
          .group(majorityGroup)
          .label((d) => {
            if (majorityChart.hasFilter() && !majorityChart.hasFilter(d.key)) {
              return `${d.key}(0%)`;
            }
            let label = d.key;
            if (all.value()) {
              label += `(${Math.floor((d.value / all.value()) * 100)}%)`;
            }
            return label;
          });

        // Top Countries Chart

        topCountriesChartSpinner.stop();
        topCountriesChart
          .height(254)
          .dimension(dateDimension)
          .group(similarityGroup)
          .ordering((d) => -d.value.total)
          .othersGrouper(false)
          .cap(13)
          .valueAccessor((d) => d.value.total / 2)
          .label((d) => ccodeToCountry[d.key])
          .title(
            (d) =>
              `${ccodeToCountryname[d.key]}: ${numberFormat(d.value.total / 2)}`
          )
          .elasticX(true)
          .xAxis()
          .ticks(4);
        // disable click
        topCountriesChart.filter = () => {};

        // Bottom Countries Chart

        bottomCountriesChartSpinner.stop();
        bottomCountriesChart
          .height(254)
          .dimension(dateDimension)
          .group(similarityGroup)
          .ordering((d) => +d.value.total)
          .othersGrouper(false)
          .cap(13)
          .valueAccessor((d) => d.value.total / 2)
          .label((d) => ccodeToCountry[d.key])
          .title(
            (d) =>
              `${ccodeToCountryname[d.key]}: ${numberFormat(d.value.total / 2)}`
          )
          .elasticX(true)
          .xAxis()
          .ticks(4);
        // disable click
        bottomCountriesChart.filter = () => {};

        // Issue Chart

        const issueDimension = ndx.dimension((d) => {
          const index = { me: 1, nu: 2, di: 3, hr: 4, co: 5, ec: 6 };
          const name = [
            "Other",
            "The Palestinian conflict",
            "Nuclear weapons and nuclear material",
            "Arms control and disarmament",
            "Human rights",
            "Colonialism",
            "(Economic) development",
          ];
          let val = [];
          let found = false;
          if (d.me > 0) {
            val.push(`${index.me}.${name[index.me]}`);
            found = true;
          }
          if (d.nu > 0) {
            val.push(`${index.nu}.${name[index.nu]}`);
            found = true;
          }
          if (d.di > 0) {
            val.push(`${index.di}.${name[index.di]}`);
            found = true;
          }
          if (d.hr > 0) {
            val.push(`${index.hr}.${name[index.hr]}`);
            found = true;
          }
          if (d.co > 0) {
            val.push(`${index.co}.${name[index.co]}`);
            found = true;
          }
          if (d.ec > 0) {
            val.push(`${index.ec}.${name[index.ec]}`);
            found = true;
          }
          if (!found) {
            val.push(`0.${name[0]}`);
          }
          return val;
        }, true);
        const issueGroup = issueDimension.group();
        issueChartSpinner.stop();
        issueChart
          .width(340)
          .height(180)
          .group(issueGroup)
          .dimension(issueDimension)
          .label((d) => d.key.split(".")[1])
          .title((d) => `${d.key.split(".")[1]}: ${d.value}`)
          .elasticX(true)
          .xAxis()
          .ticks(4);

        // Fluctuation Chart

        const fluctuationDimension = ndx.dimension((d) => {
          const val =
            (100 * Math.abs(d.no - d.yes)) / (d.no + d.yes + d.abstain);
          return isNaN(val) ? 101 : val;
        });
        const fluctuationGroup = fluctuationDimension.group();
        fluctuationChartSpinner.stop();
        fluctuationChart
          .width(303)
          .dimension(fluctuationDimension)
          .group(fluctuationGroup)
          .elasticY(true)
          .centerBar(true)
          .gap(1)
          .round(Math.floor)
          .alwaysUseRounding(true)
          .x(d3.scaleLinear().domain([0, 100]))
          .renderHorizontalGridLines(true)
          .filterPrinter((filters) => {
            const filter = filters[0];
            let s = "";
            s += `${filter[0]}% -> ${filter[1]}%`;
            return s;
          });
        fluctuationChart.xAxis().tickFormat((v) => `${v}%`);
        fluctuationChart.yAxis().ticks(5);

        // Vote Chart

        const yesByYearGroup = yearDimension.group().reduceSum((d) => {
          const vote = +d[currentCcode];
          if (vote !== 1 && vote !== 3) return 0;
          else if (d.yes > d.no) return vote === 1 ? 1 : 0;
          else return vote === 3 ? 1 : 0;
        });
        const noByYearGroup = yearDimension.group().reduceSum((d) => {
          const vote = +d[currentCcode];
          if (vote !== 1 && vote !== 3) return 0;
          else if (d.yes > d.no) return vote === 3 ? 1 : 0;
          else return vote === 1 ? 1 : 0;
        });
        const abstainByYearGroup = yearDimension.group().reduceSum((d) => {
          return +d[currentCcode] === 2 ? 1 : 0;
        });
        const absentByYearGroup = yearDimension.group().reduceSum((d) => {
          return +d[currentCcode] === 8 ? 1 : 0;
        });
        voteChartSpinner.stop();
        voteChart
          .width(923)
          .height(200)
          .transitionDuration(1000)
          .margins({ top: 30, right: 50, bottom: 25, left: 40 })
          .dimension(yearDimension)
          .mouseZoomable(true)
          .rangeChart(volumeChart)
          .x(
            d3.scaleTime().domain([new Date(1946, 0, 1), new Date(2021, 0, 14)])
          )
          .round(d3.timeYear.round)
          .xUnits(d3.timeYears)
          .elasticY(true)
          .renderHorizontalGridLines(true)
          .legend(new dc.Legend().x(800).y(10).itemHeight(13).gap(5))
          .brushOn(false)
          .group(yesByYearGroup, "Yearly agree")
          .valueAccessor((d) => d.value)
          .stack(noByYearGroup, "Yearly disagree", (d) => d.value)
          .stack(abstainByYearGroup, "Yearly abstain", (d) => d.value)
          .stack(absentByYearGroup, "Yearly absent", (d) => d.value)
          .title((d) => {
            return `${dateFormat(d.key)}\n${d.value}`;
          });

        // Volume Chart

        volumeChartSpinner.stop();
        volumeChart
          .width(923)
          .height(40)
          .margins({ top: 0, right: 50, bottom: 20, left: 40 })
          .dimension(yearDimension)
          .group(volumeByYearGroup)
          .centerBar(true)
          .gap(1)
          .x(
            d3.scaleTime().domain([new Date(1946, 0, 1), new Date(2021, 0, 14)])
          )
          .round(d3.timeMonth.round)
          .alwaysUseRounding(true)
          .xUnits(d3.timeMonths);

        // Resolution counter

        resCount
          .crossfilter(ndx)
          .groupAll(all)
          .html({
            some:
              "<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records" +
              " | <a href='javascript:dc.filterAll(); dc.renderAll();'>Reset All</a>",
            all:
              "<span class='margin'>All records selected. Please click on the graph to apply filters.</span>",
          });

        // Resolution table

        resTable
          .dimension(dateDimension)
          .section((d) => {
            const format = d3.format("02d");
            return `${d.dd.getFullYear()}/${format(d.dd.getMonth() + 1)}`;
          })
          .size(10)
          .columns([
            "date",
            {
              label: "Number",
              format: (d) =>
                `<a href="https://undocs.org/pdf?symbol=en/A/${d.unres.substring(
                  2
                )}">${d.unres}</a>`,
            },
            "short",
            "descr",
            "abstain",
            "yes",
            "no",
            {
              label: ccodeToCountryname[currentCcode],
              format: (d) => {
                switch (+d[currentCcode]) {
                  case 1:
                    return "Yes";
                  case 2:
                    return "Abstain";
                  case 3:
                    return "No";
                  case 8:
                    return "Absent";
                  default:
                    return "Not a member";
                }
              },
            },
          ])
          .sortBy((d) => d.dd)
          .order(d3.ascending)
          .on("renderlet", (table) => {
            table.selectAll(".dc-table-group").classed("info", true);
          });

        if (majorityChartFilters && majorityChartFilters.length > 0)
          majorityChart.replaceFilter(majorityChartFilters);
        if (fluctuationChartFilters && fluctuationChartFilters.length > 0)
          fluctuationChart.replaceFilter(fluctuationChartFilters[0]);
        if (topCountriesChartFilters && topCountriesChartFilters.length > 0)
          topCountriesChart.replaceFilter(topCountriesChartFilters);
        if (
          bottomCountriesChartFilters &&
          bottomCountriesChartFilters.length > 0
        )
          bottomCountriesChart.replaceFilter(bottomCountriesChartFilters);
        if (issueChartFilters && issueChartFilters.length > 0)
          issueChart.replaceFilter(issueChartFilters);
        if (voteChartFilters && voteChartFilters.length > 0)
          voteChart.replaceFilter(voteChartFilters);
        if (volumeChartFilters && volumeChartFilters.length > 0)
          volumeChart.replaceFilter(volumeChartFilters[0]);
        if (resCountFilters && resCountFilters.length > 0)
          resCount.replaceFilter(resCountFilters);
        if (resTableFilters && resTableFilters.length > 0)
          resTable.replaceFilter(resTableFilters);
        if (importantBoxFilters && importantBoxFilters.length > 0)
          importantBox.replaceFilter(importantBoxFilters[0]);
        if (amendBoxFilters && amendBoxFilters.length > 0)
          amendBox.replaceFilter(amendBoxFilters[0]);
        if (paraBoxFilters && paraBoxFilters.length > 0)
          paraBox.replaceFilter(paraBoxFilters[0]);

        // Map Chart

        const iso3Dimension = ndx.dimension((d) => {
          return ccodeToCountry[d.ccode];
        });

        const width = 940;
        const height = 500;

        const projection = d3
          .geoMercator()
          .scale(150)
          .translate([width / 2, height - 180]);

        mapChartSpinner.stop();
        mapChart
          .width(943)
          .height(500)
          .dimension(iso3Dimension)
          .group(similarityGroup)
          .colors(
            d3
              .scaleQuantize()
              .domain(d3.extent(similarityGroup.all(), (d) => d.value))
              .range([
                "#d43d51",
                "#de6069",
                "#e67f83",
                "#ec9c9d",
                "#f0b8b8",
                "#f1d4d4",
                "#f1f1f1",
                "#d5e0cf",
                "#bad0af",
                "#9fc08f",
                "#83af70",
                "#679f51",
                "#488f31",
              ])
          )
          .colorAccessor((value) => value)
          .colorCalculator((value) =>
            value ? mapChart.colors()(value) : "#ccc"
          )
          .overlayGeoJson(
            mapJson.features,
            "country",
            (d) => d.properties.ISO_A3
          )
          .projection(projection)
          .keyAccessor((d) => ccodeToCountry[d.key])
          .valueAccessor((d) => d.value.total / 2)
          .title(
            (d) =>
              "Country: " +
              countryToCountryname[d.key] +
              "\nScore: " +
              numberFormat(d.value)
          );

        mapChart.on("preRender", (chart) => {
          const min = Math.abs(d3.min(chart.data(), chart.valueAccessor()));
          const max = Math.abs(d3.max(chart.data(), chart.valueAccessor()));
          const bound = Math.max(min, max);
          chart.colorDomain([-bound, bound]);
        });
        mapChart.on("preRedraw", (chart) => {
          const min = Math.abs(d3.min(chart.data(), chart.valueAccessor()));
          const max = Math.abs(d3.max(chart.data(), chart.valueAccessor()));
          const bound = Math.max(min, max);
          chart.colorDomain([-bound, bound]);
        });
        mapChart.on("pretransition", (chart) => {
          chart
            .selectAll(`.country.${country.toLowerCase()}`)
            .classed("selected", true);
        });
        mapChart.on("postRender", (chart) => {
          const zoom = d3.zoom();
          zoom.on("zoom", () => {
            const { k, x, y } = d3.event.transform;
            chart
              .select("g.layer0")
              .attr("transform", `translate(${x},${y}) scale(${k})`);
          });
          chart.svg().call(zoom);
        });
        mapChart.commitHandler((commitHandler) => {});
        mapChart.addFilterHandler((filters, filter) => {
          majorityChartFilters = majorityChart.filters();
          fluctuationChartFilters = fluctuationChart.filters();
          topCountriesChartFilters = topCountriesChart.filters();
          bottomCountriesChartFilters = bottomCountriesChart.filters();
          issueChartFilters = issueChart.filters();
          voteChartFilters = voteChart.filters();
          volumeChartFilters = volumeChart.filters();
          resCountFilters = resCount.filters();
          resTableFilters = resTable.filters();
          importantBoxFilters = importantBox.filters();
          amendBoxFilters = amendBox.filters();
          paraBoxFilters = paraBox.filters();

          if (filter.length > 0) selectCountry(filter);
          return filters;
        });

        dc.renderAll();
      });
    }
    selectCountry(defaultCountry);
  });
});
