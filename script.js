async function init() {
    const response = await fetch('./ilp_data.json');
    const data = await response.json();
    const container = document.getElementById('scheduleContainer');
    const today = new Date();
    let curDay = today.getDay();

    if (curDay == 0 || curDay == 6) {
        const weekend = document.createElement('h2');
        weekend.innerText = 'Today is a weekend. The ILP is all yours.'
        container.appendChild(weekend);
        return;
    }

    const szpos = [
        ['14%', '20%', 0.04], // 1101
        ['39%', '22%', 0.04], // 1203
        ['11%', '32%', 0.04], // 1302
        ['64%', '21%', 0.04], // 2101
        ['83%', '24%', 0.03], // 2207
        ['88%', '24%', 0.03], // 2209
        ['94%', '23%', 0.04], // 2211
        ['61%', '33%', 0.04], // 2302
        ['8.7%', '64%', 0.03], // 3101
        ['12.7%', '64.5%', 0.03], // 3103
        ['16.7%', '65%', 0.03], // 3105
        ['20.7%', '65.5%', 0.03], // 3107
        ['33.6%', '65%', 0.03], // 3205
        ['37.5%', '64.7%', 0.03], // 3207
        ['41.4%', '64.3%', 0.03], // 3209
        ['45.3%', '64%', 0.03], // 3211
        ['16%', '84%', 0.03], // 3310
        ['12.1%', '84%', 0.03], // 3312
        ['8.2%', '84%', 0.03], // 3314
        ['4.3%', '84%', 0.03], // 3316
        ['58.4%', '64%', 0.03], // 4101
        ['62.3%', '64.5%', 0.03], // 4103
        ['66.2%', '65%', 0.03], // 4105
        ['70.1%', '65.5%', 0.03], // 4107
        ['83.4%', '65%', 0.03], // 4205
        ['87.3%', '64.7%', 0.03], // 4207
        ['91.1%', '64.3%', 0.03], // 4209
        ['95%', '64%', 0.03], // 4211
    ];

    function calcTime(idx) { // return array with remaining use time (-1 if not used) and remaining non-use time (-1 if free for rest of day)
        const newtoday = new Date();
        let curTime = newtoday.getHours() * 60 + newtoday.getMinutes();
        const roomEvents = data[curDay-1].rooms[idx].events;
        let nextUse = 1000000;
        let timeleft = -1;
        for (const evnt of roomEvents) {
            if (evnt.start > curTime) nextUse = Math.min(nextUse, evnt.start);
            if (evnt.start <= curTime && evnt.end >= curTime) timeleft = evnt.end - curTime;
        }
        nextUse = nextUse == 1000000 ? -1 : nextUse-curTime;
        return [timeleft, nextUse];
    }

    function rSched(idx) {
        const tray = document.getElementById('row-tray');
        tray.innerHTML = '';
        const row = document.createElement('button');
        row.className = 'room-row';
        row.onclick = () => tray.removeChild(row);
        
        row.innerHTML = `<div class="room-label">${data[0].rooms[idx].id}</div>`;
        const col = document.createElement('div');
        col.className = 'room-col';

        const timesCont = document.createElement('div');
        timesCont.className = 'times-container';
        for (let i = 7; i <= 23; i++) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time';
            if (i == 7 || i == 23) {
                timeDiv.style.width = `calc(var(--hour-width)*0.5)`;
            } else {
                timeDiv.innerText = ((i-1) % 12) + 1;
                timeDiv.style.width = `var(--hour-width)`;
            }
            timesCont.appendChild(timeDiv);
        }
        
        const eventsCont = document.createElement('div');
        eventsCont.className = 'events-container';

        data[curDay-1].rooms[idx].events.forEach(ev => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            
            // Offset by 7:00 AM (420 minutes) so the chart doesn't start at midnight
            const startOffset = ev.start - 420; 
            const duration = ev.end - ev.start;

            eventDiv.style.left = `calc(${startOffset} * var(--minute-width))`;
            eventDiv.style.width = `calc(${duration} * var(--minute-width))`;
            eventDiv.innerText = ev.course;
            eventDiv.title = `${ev.course}: ${ev.start} - ${ev.end}`;
            
            eventsCont.appendChild(eventDiv);
        });

        col.append(timesCont);
        col.appendChild(eventsCont);
        row.appendChild(col);
        tray.appendChild(row);
    }

    function render() {
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'map-wrapper';
        container.appendChild(wrapper);

        for (let i = 1; i <= 4; i++) {
            const ff = document.createElement('img');
            ff.src = 'ILPFloor' + i + '.png';
            wrapper.appendChild(ff);
        }
        for (const preset of szpos) {
            const circle = document.createElement('button');
            circle.classList.add('dynamic-circle');
            // Pass the raw percentage strings from your array
            circle.style.setProperty('--x', preset[0]); 
            circle.style.setProperty('--y', preset[1]);
            
            // Use 'vw' for size so it scales with the viewport
            circle.style.setProperty('--size', (preset[2] * 100) + 'vw');
            circle.onclick = () => rSched(szpos.indexOf(preset));

            const timeleft = calcTime(szpos.indexOf(preset));
            if (timeleft[0] != -1) {
                circle.style.backgroundColor = 'black';
                circle.style.color = 'white';
                circle.innerText = timeleft[0];
            } else {
                if (timeleft[1] != -1) {
                    const intensity = Math.min(200, (timeleft[1] / 60) * 200) + 55;
                    circle.style.backgroundColor = `rgb(255, ${intensity}, ${intensity})`;
                    circle.style.color = 'black';
                    circle.innerText = timeleft[1];
                } else {
                    circle.style.backgroundColor = 'white';
                    circle.style.color = 'black';
                    circle.innerText = 'FREE';
                }
            }

            wrapper.appendChild(circle);
        }
        const rowTray = document.createElement('div');
        rowTray.id = 'row-tray';
        rowTray.className = 'row-tray';
        container.appendChild(rowTray);
    }
    render();

    // 1. Move your circle-styling logic into a standalone function
    function updateCircleStyles() {
        const circles = document.querySelectorAll('.dynamic-circle');
        
        circles.forEach((circle, index) => {
            const timeleft = calcTime(index); // Use the index to check the room

            if (timeleft[0] !== -1) {
                circle.style.backgroundColor = 'black';
                circle.style.color = 'white';
                circle.innerText = timeleft[0];
            } else if (timeleft[1] !== -1) {
                const intensity = Math.min(200, (timeleft[1] / 60) * 200) + 55;
                circle.style.backgroundColor = `rgb(255, ${intensity}, ${intensity})`;
                circle.style.color = 'black';
                circle.innerText = timeleft[1];
            } else {
                circle.style.backgroundColor = 'white';
                circle.style.color = 'black';
                circle.innerText = 'FREE';
            }
        });
    }

    // 2. Set the interval at the end of your init() function
    setInterval(() => {
        const now = new Date();
        if (now.getDay() !== curDay) {
            curDay = now.getDay();
            render(curDay - 1); // Full re-render if the day actually changed
        } else {
            updateCircleStyles(); // Otherwise just update the numbers
        }
    }, 30000);
}

init();