var prev_data = Object();           // remember data fetched last time
var waiting_for_update = false; // are we currently waiting?
var LONG_POLL_DURATION = 60000; // how long should we wait? (msec)
var first_time_rendering_chart = true;
var global_steps_doughnut = Object(),
  global_pomodoro_doughnut = Object(),
  global_unproductive_doughnut = Object();
/**
 * Load data from /data, optionally providing a query parameter read
 * from the #format select
 */
function load_data() {
    $.ajax({ url: '/data',
             success: function(data) {
                          display_data(data);
                          wait_for_update();
                      },
    });
    return true;
}


/**
 * Uses separate update notification and data providing URLs. Could be combined, but if
 * they're separated, the Python routine that provides data needn't be changed from
 * what's required for standard, non-long-polling web app. If they're combined, arguably
 * over-loads the purpose of the function.
 */
function wait_for_update() {
    if (!waiting_for_update) {
        waiting_for_update = true;
        $.ajax({ url: '/updated',
                 success:  load_data,        // if /update signals results ready, load them!
                 complete: function () {
                    waiting_for_update = false;
                    setTimeout(wait_for_update, 50000); // if the wait_for_update poll times out, rerun
                 },
                 timeout:  LONG_POLL_DURATION,
               });
    }

    // wait_for_update guard to ensure not re-entering already running wait code
    // added after user suggestion. This check has not been needed in my apps
    // and testing, but concurrency is an area where an abundance of caution is
    // often the best policy.
}


/**
 * show the data acquired by load_data()
 */
function display_data(data) {
    if (data && (data != prev_data)) {      // if there is data, and it's changed
        // update the contents of several HTML divs via jQuery
        $('#rescue_time_daily_productivity').html(data.rescue_time_daily_productivity);
        $('#rescue_time_daily_unproductivity').html(data.rescue_time_daily_unproductivity);
        $('#rescue_time_daily_top_three').html(data.rescue_time_daily_top_three);
        $('#rescue_time_past_seven_productivity').html(data.rescue_time_past_seven_productivity);
        $('#rescue_time_past_seven_unproductivity').html(data.rescue_time_past_seven_unproductivity);
        $('#rescue_time_past_seven_top_five').html(data.rescue_time_past_seven_top_five);
        // $('#next_bus').html(data.next_bus);
        $('#weight').html(data.weight);
        $('#total_tasks').html("Number of outstanding tasks: " + data.total_tasks);
        $('#daily_completed_tasks').html("Number of tasks completed today: " + data.daily_completed_tasks);
        $('#past_seven_completed_tasks').html("Number of tasks completed in the last 7 days: " + data.past_seven_completed_tasks);
        $('#top_tracks').html(data.top_tracks);
        $('#top_artists').html(data.top_artists);
        $('#weather_hourly').html(data.weather_hourly);
        $('#temp').html(data.temp);
        $('#weather_today').html(data.weather_today);
        $('#current_steps').html("Steps today: " + String(data.current_steps)  + " steps");
        $('#average_past_seven_steps').html(data.average_past_seven_steps),
        $('#chess_rating').html(data.chess_rating);
        $('#chess_games').html(data.chess_games);
        $('#daily_pomodoros').html(data.daily_pomodoros);
        $('#past_seven_days_pomodoros').html(data.past_seven_days_pomodoros);
        //remove loading text from HTML
        $('#loading').remove();

        if (first_time_rendering_chart) {
          global_steps_doughnut = create_steps_doughnut(data);
          global_pomodoro_doughnut = create_pomodoro_doughnut(data);
          global_unproductive_doughnut = create_unproductive_doughnut(data);
          first_time_rendering_chart = false;
        }
        else {
          update_doughnuts(global_steps_doughnut, global_pomodoro_doughnut, global_unproductive_doughnut, data);
        }

        $.ajax({
            type: 'GET',
            url: 'https://wakatime.com/share/@0c62f2ad-9fa5-43c7-a08f-7b1562918a7d/43cd4128-5361-43db-b51b-d965e3c575a5.json',
            dataType: 'jsonp',
            success: function(response) {
              console.log(response.data);
            },
          });


          $.ajax({
            type: 'GET',
            url: 'https://wakatime.com/share/@0c62f2ad-9fa5-43c7-a08f-7b1562918a7d/27967d19-0ce0-42a6-9f4a-c3c2440cf575.json',
            dataType: 'jsonp',
            success: function(response) {
              console.log(response.data);
            },
          });
        // remember this data, in case want to compare it to next update
        prev_data = data;
      }
}


function update_doughnuts(steps_doughnut, pomodoro_doughnut, unproductive_doughnut, data) {
  var total_pomodoros = 0;
  for (var key in data.daily_doughnut_pomodoro){
    total_pomodoros += data.daily_doughnut_pomodoro[key];
  }
  var pomodoro_goal = 3,
      current_pomodoro_percent = total_pomodoros > pomodoro_goal ? 100 : Math.round(total_pomodoros/pomodoro_goal * 100),
      steps_goal = 5000,
      current_steps_percent = data.current_steps > steps_goal ? 100 : Math.round(data.current_steps/steps_goal * 100),
      unproductivity_goal = 1,
      current_unproductive_percent = data.rescue_time_daily_unproductivity > unproductivity_goal ? 100 : Math.round(data.rescue_time_daily_unproductivity/unproductivity_goal * 100);
    //Updating steps doughnut
      steps_doughnut.options.title.text = String(current_steps_percent) + "%";
      steps_doughnut.options.data[0].dataPoints[0].y = current_steps_percent;
      steps_doughnut.options.data[0].dataPoints[1].y = 100 - current_steps_percent;
    //Updating pomodoro doughnut
      pomodoro_doughnut.options.title.text = String(current_pomodoro_percent) + "%";
      pomodoro_doughnut.options.data[0].dataPoints[0].y = current_pomodoro_percent;
      pomodoro_doughnut.options.data[0].dataPoints[1].y = 100 - current_pomodoro_percent;
    //Updating unproductivity doughnut
    unproductive_doughnut.options.title.text = String(current_unproductive_percent) + "%";
    unproductive_doughnut.options.data[0].dataPoints[0].y = current_unproductive_percent;
    unproductive_doughnut.options.data[0].dataPoints[1].y = 100 - current_unproductive_percent;
    //Re-rendering the doughnuts
    steps_doughnut.render();
    pomodoro_doughnut.render();
    unproductive_doughnut.render();
}


function create_pomodoro_doughnut(data){
  var total_pomodoros = 0;
  for (var key in data.daily_doughnut_pomodoro){
    total_pomodoros += data.daily_doughnut_pomodoro[key];
  }
  var pomodoro_goal = 3,
      current_pomodoro_percent = total_pomodoros > pomodoro_goal ? 100 : Math.round(total_pomodoros/pomodoro_goal * 100);
  var pomodoro_doughnut = new CanvasJS.Chart("pomodoro_doughnut", {
    animationEnabled: true,
    backgroundColor: "transparent",
    title: {
      fontColor: "#848484",
      fontSize: 60,
      horizontalAlign: "center",
      text: String(current_pomodoro_percent) + "%",
      fontFamily: "Roboto",
      verticalAlign: "center"
    },
    toolTip: {
      backgroundColor: "#ffffff",
      borderThickness: 0,
      cornerRadius: 0,
      fontColor: "#424242"
    },
    data: [
      {
        explodeOnClick: false,
        innerRadius: "94%",
        radius: "90%",
        startAngle: 270,
        type: "doughnut",
        dataPoints: [
          { y: current_pomodoro_percent, color: "#33702a", toolTipContent: String(total_pomodoros) + " hours"},
          { y: 100 - current_pomodoro_percent, color: "#424242", toolTipContent: null }
        ]
      }
    ]
  });

  pomodoro_doughnut.render()
  return pomodoro_doughnut;
}


function create_unproductive_doughnut(data){
  var unproductivity_goal = 1,
      current_unproductive_percent = data.rescue_time_daily_unproductivity > unproductivity_goal ? 100 : Math.round(data.rescue_time_daily_unproductivity/unproductivity_goal * 100);
  var unproductive_doughnut = new CanvasJS.Chart("unproductivity_doughnut", {
    animationEnabled: true,
    backgroundColor: "transparent",
    title: {
      fontColor: "#848484",
      fontSize: 60,
      horizontalAlign: "center",
      text: String(current_unproductive_percent) + "%",
      fontFamily: "Roboto",
      verticalAlign: "center"
    },
    toolTip: {
      backgroundColor: "#ffffff",
      borderThickness: 0,
      cornerRadius: 0,
      fontColor: "#424242"
    },
    data: [
      {
        explodeOnClick: false,
        innerRadius: "94%",
        radius: "90%",
        startAngle: 270,
        type: "doughnut",
        dataPoints: [
          { y: current_unproductive_percent, color: "#b30000", toolTipContent: String(data.rescue_time_daily_unproductivity) + " hours"},
          { y: 100 - current_unproductive_percent, color: "#424242", toolTipContent: null }
        ]
      }
    ]
  });

  unproductive_doughnut.render()
  return unproductive_doughnut;
}


//This creates and returns the steps doughnut chart
function create_steps_doughnut(data) {
    var steps_goal = 5000,
        current_steps_percent = data.current_steps > steps_goal ? 100 : Math.round(data.current_steps/steps_goal * 100);
    var steps_doughnut = new CanvasJS.Chart("steps_doughnut", {
      animationEnabled: true,
      backgroundColor: "transparent",
      title: {
        fontColor: "#848484",
        fontSize: 60,
        horizontalAlign: "center",
        text: String(current_steps_percent) + "%",
        fontFamily: "Roboto",
        verticalAlign: "center"
      },
      toolTip: {
        backgroundColor: "#ffffff",
        borderThickness: 0,
        cornerRadius: 0,
        fontColor: "#424242"
      },
      data: [
        {
          explodeOnClick: false,
          innerRadius: "94%",
          radius: "90%",
          startAngle: 270,
          type: "doughnut",
          dataPoints: [
            { y: current_steps_percent, color: "#33702a", toolTipContent: String(data.current_steps) + " steps" },
            { y: 100 - current_steps_percent, color: "#424242", toolTipContent: null }
          ]
        }
      ]
    });
    // jQuery.inview plugin
    steps_doughnut.render()
    return steps_doughnut;
}


$(document).ready(function() {
  //Create unproductivity_doughnut
  load_data();
});
