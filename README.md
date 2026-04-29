## Massachusetts Labor Story (2020-2026)

An interactive, scroll-based data story showing how Massachusetts unemployment and labor-force conditions changed from the COVID shock through recent recovery, compared with the United States.

Core message: **Massachusetts improved significantly after 2020, but unemployment still remains slightly above the U.S. in recent months.**

![Project preview](readme.png)

### Live Website

[View Project Website](https://avanith12.github.io/Unemployment-in-Massachusetts-vs.-the-U.S./)

### What This Project Analyzes

Using monthly data from 2020 to January 2026 (excluding October 2025 missing values), the story highlights:

- Pandemic-era unemployment spike and post-shock recovery trend
- Massachusetts vs U.S. unemployment comparison over time
- MA-U.S. unemployment gap (monthly and yearly)
- Peak-to-latest recovery slope for both MA and U.S.
- Labor-force participation comparison (MA vs U.S.)
- Month-over-month changes in Massachusetts unemployment

### Charts Included

- Unemployment Rate: Massachusetts vs United States
- Massachusetts in National Context (U.S. map)
- Unemployment Gap: Massachusetts minus U.S.
- Recovery Slope: Peak to Latest
- Yearly Average Gap (MA minus U.S.)
- Labor Force Participation: Massachusetts vs U.S.
- Monthly Change in MA Unemployment (MoM)

### Interactive Features

- Scroll-reveal chart animations (line draw + bar grow effects)
- Narrative in-page story callouts between charts
- KPI strip with modal explainers (Peak MA, Latest MA, Latest U.S., Current Gap, Net Improvement)
- Big visual chart annotations/callouts for key moments
- Custom cursor and neon black-theme styling
- Top scroll progress bar
- Audio ear-candy:
  - welcome chime (after first user interaction, due to browser autoplay rules)
  - chart-specific tones on reveal
- End-screen experience:
  - story completion overlay
  - full-screen confetti celebration + sound
  - automatic scroll back to top

### Tech Stack

- HTML, CSS, JavaScript
- D3.js (charts, transitions, scales, axes)
- TopoJSON (U.S. map rendering)

### Data Source

- `massachusetts_unemployment.csv` (included in this repository)
