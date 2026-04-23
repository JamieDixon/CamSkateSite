const directAccessStratrgy = (event) => {
  const foundEvent = SESSION_CONFIG[event.summary.toLowerCase()];
  return foundEvent ? { title: event.summary, ...foundEvent } : null;
};

// This strategy allows us to define alternative titles for events in the SESSION_CONFIG.
// This is useful for events like "quads & blades" which might be entered in the calendar with
// a slightly different title but we still want to match it to the same session configuration.
const alternativeTitleStrategy = (event) => {
  const [eventKey, eventValue] = Object.entries(SESSION_CONFIG).find(
    ([key, value]) =>
      value.altTitles &&
      value.altTitles.some(
        (t) => t.toLowerCase() === event.summary.toLowerCase(),
      ),
  );

  return eventValue ? { title: eventKey, ...eventValue } : null;
};

const applyStrategies = (event) => {
  const strategies = [directAccessStratrgy, alternativeTitleStrategy];
  for (const strategy of strategies) {
    const result = strategy(event);
    if (result) return result;
  }
  return null;
};

const calendarEvents = (function calendarEvents() {
  const CALENDAR_ID =
    "648a32abb0a80624c5f98e8e4bfd057578a6aed5110ba2addc6f9496fa9cabb4@group.calendar.google.com";
  const API_KEY = "AIzaSyAbxzGY7irnlqDnG9NwmLuzwVb2Q3tkr3I";

  function getCalendarEvents(params, fallbackEvents = []) {
    const defaultParams = { key: API_KEY, ...params };
    const queryParams = new URLSearchParams(defaultParams).toString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?${queryParams}`;

    return fetch(url)
      .then((response) => {
        if (!response.ok && !location.hostname.includes("cam-skate.co.uk")) {
          return { items: fallbackEvents };
        }
        return response.json();
      })
      .then((data) => data.items || [])
      .then((events) => {
        return events.reduce((agg, event) => {
          const eventFromConfig = applyStrategies(event);

          return eventFromConfig
            ? [
                ...agg,
                {
                  summary: eventFromConfig.title,
                  start: event.start,
                  end: event.end,
                  ...eventFromConfig,
                },
              ]
            : agg;
        }, []);
      })
      .catch((error) => {
        console.error("Error fetching calendar events:", error);
        throw error;
      });
  }

  return { getCalendarEvents };
})();
