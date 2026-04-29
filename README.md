## Massachusetts Labor Story (2020-2026)

This project is a scroll-based web data story about labor force and unemployment trends in Massachusetts compared with the United States.  
It is built as an author-driven explanatory visualization using D3.js, with focus on storytelling, readable design, and animated chart reveals.

![Project preview](readme.png)

### Live Website

[View Project Website](https://avanith12.github.io/Unemployment-in-Massachusetts-vs.-the-U.S./)

### Project Focus

- Track how Massachusetts unemployment changed from the pandemic shock through partial recovery
- Compare Massachusetts against the national benchmark over time
- Explain not just trend direction, but magnitude, timing, and remaining gap

### Analysis Completed

Using monthly data from 2020 to January 2026 (excluding October 2025 missing values), the story shows:

- **Pandemic shock and recovery:** unemployment spikes early, then declines over subsequent years
- **Massachusetts vs U.S. comparison:** Massachusetts improves but remains slightly above the national rate in recent months
- **Gap dynamics:** the MA-U.S. unemployment gap widens sharply in 2020, then narrows without fully closing
- **Recovery slope view:** peak-to-latest comparison highlights large improvement for both MA and U.S.
- **Yearly average gap view:** annual bars reinforce strongest separation in early period and later convergence
- **Labor force participation comparison:** participation rebounds after the shock, with ongoing month-to-month fluctuation
- **Monthly MA change (MoM):** recovery is uneven, with alternating gains and setbacks

### Visual Story Structure

The webpage includes:

- Hero message and visual framing
- KPI strip (Peak MA, Latest MA, Latest U.S., Current Gap, Net Improvement)
- Multiple animated charts triggered on scroll
- In-page narrative messages with reveal/typewriter effects
- Final takeaway panel and class project branding

### Tech Stack

- HTML, CSS, JavaScript
- D3.js (charts, scales, axes, transitions)
- TopoJSON (U.S. map context)

### Data Source

`massachusetts_unemployment.csv` in this repository.
