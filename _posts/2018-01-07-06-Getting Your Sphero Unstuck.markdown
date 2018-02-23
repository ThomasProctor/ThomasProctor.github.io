---
title:  "Getting your Sphero unstuck."
date:   2018-01-07 15:08:10 -0500
excerpt: The Sphero Mini's collision detection doesn't really work. I came up with a kludge.
header:
  overlay_image: img/SpheroPhoto-1024x.jpg
  overlay_filter: rgba(0, 0, 0, 0.6)
  caption: "© 2018 T. C. Proctor"
  teaser: img/SpheroPhoto-cropped-preview.jpg
category: DataScience
tags: [data science, robots, Sphero]
---


This Christmas I got a Sphero Mini robot, a little plastic ball made by a company
that started designing rolling robots at a *very* opportune time for some choice
Star Wars merchandising deals. It is controlled remotely via bluetooth, with
most of the computation being done on the controlling device. The robot is
mostly only responsible for sensors, bluetooth communication, and some basic tasks,
like staying upright.

It can be programmed via a stripped down javascript interface
.<sup id="s1" name="s1">[1](#f1)</sup> I thought I
might be able to make a halfway decent toy for my cat to play with while we're
at work. I thought I'd start with a program that would just go straight until it
hit something, turn around in a random direction, and repeat.

That was a lot easier said than done. There is a "collision detection" function, but unfortunately, it rarely detects collisions when they happen.
Most of the time, the robot will hit a wall and just keep going into it, oblivious to the collision.
Here's a sad video of that happening:

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/9pV7IMtzdjs?rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

That video shows typical behavior.
The robot will hit a wall and just keep going, completely oblivious to the fact that it hit a wall.


Since I couldn't find a way to modify the way collisions were detected, I had to come up with a way to do it myself.
The key thing I noticed was that the robot rocked back and forth when stuck
.<sup id="constant_var">[2](#f2)</sup>
I collected a stream of data from the robot while it was moving normally and while it was stuck.
I first looked at the pitch,the angle the robot makes with the horizontal along the direction of its travel.
You can see a comparison of the pitch while rolling and while stuck in the figure below.
![Pitch over time, rolling and stuck]({{ "img/pitch_vs_time.png" | absolute_url }})
You can clearly see the oscillation in the plot that you can see in the video.
However, it might be hard to detect that reliably.
The robot does the same thing while rolling, rocking back and forth, just not quite as fast and consistently.

Instead, I looked at the rotational velocity of the robot - i.e. the first derivative of the pitch.<sup id="constant_var">[3](#f3)</sup>
This was more useful because the amplitude of oscillation was much much greater when stuck than when rolling normally.
Looking at the plot of the rotational velocity of the pitch, as seen in the figure below, we can also see that the frequency of oscillation when stuck is quite high.
![Pitch change over time, rolling and stuck]({{ "img/pitch_change_per_second.png" | absolute_url }})
The robot is constantly rotating in *some* direction when stuck.
Meanwhile, when moving, the robot's rotational velocity generally hovers around zero, apart from some brief periods of movement.

If we look at a histogram of that data, as seen in the figure below, the difference is clear.
![Histogram of pitch change over time, rolling and stuck]({{ "img/pitch_change_per_second_histogram.png" | absolute_url }})
When the ball is rolling, the rotational velocity is concentrated around zero.
Meanwhile, the stuck version has a much wider distribution of rotational velocities, and is rather bimodal.

I figured I could capture this behavior by looking at the standard deviation of the rotational velocity.
This is a measure of how "spread out" the histogram of the data is.

I wrote some code that will continuously monitor the standard deviation.
If the standard deviation goes above a certain value for a certain time period, it will turn the robot around.

For being pretty rudimentary, it actually works pretty well.
I found that I could pretty much eliminate the chance of "false positives" - turning around when the robot is not actually stuck.<sup id="constant_var">[4](#f4)</sup>
It can take a while for the robot to realize that it's stuck, but it reliably will eventually.

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/LHHSTQb8eMs?rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

This program manages to bounce around the room pretty well, but it is far from perfect.
I'd like to be able to reduce the amount of time the robot takes to realize that it's stuck.
I've tried something that looked at the frequency of the oscillation by looking at the Fourier transform.
However, it didn't seem to complement the standard deviation well, only detecting that the robot was stuck in cases where the standard deviation measure already realized it.





--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
<small>
<a name="f1">1</a> The interface I've been forced to use is the one provided by
Sphero Edu. There are other interfaces available for other Sphero robots.
However, the Sphero Mini is new, and it looks like no one has released anything
else. I personally can't wait for other options. JavaScript is probably the last
language anyone wants to use for numerics. The process of testing code is
tedious: write code on your computer in a chrome app with very few coding
features, let alone version control, update the version on your phone, connect
to the robot, and then discover you forgot to properly match parentheses and
start the process over again. I'm especially looking forward to [the Go robotics
framework](https://github.com/hybridgroup/gobot/issues/474). Writing in a
compiled language would make finding syntax errors faster, and having a real
linear algebra package (or any package for that matter - Sphero Edu doesn't
allow npm imports) available would make the code much easier to write.<a href="#s1">^</a></small>

<a name="f2">2</a>  <small>I'm not entirely sure why this oscillation happens, but I have a guess.
A Sphero works sort of like a hamster in a hamster ball.
The robot itself sits in a spherical shell, like the hamster's ball.
It moves forward by turning the spherical shell with wheels that rest against it.
The robot inside the shell is weighted such that it will normally sit upright, and it will generally try to stay upright.
When the robot is hitting a wall however, the outer shell can't rotate.
Like a hamster trying to run inside a ball that won't turn, the robot instead moves up the side of the ball.
It realizes that its flipping over, and turns of the motor to right itself.
Once it has righted itself, it repeats the process, creating the oscillation.</small>

<small>I'm actually quite unsure about this explanation.
It might be very wrong.
The period of oscillation is about 0.05 seconds.
At 20Hz, this is right on the edge of something we'd hear as sound.
I doubt the robot would vibrate this fast if the cause is overcompensating while trying to keep itself upright.
The robot would have to observe itself falling over and change its what it's doing too fast for this to be the cause.
In defense of this explanation is the observation that the 0.05 second period is about the same as the sampling rate of the data.
Because it is interacting with the phone over bluetooth, is about 0.05 seconds.
If the oscillation is being caused by flaws in the algorithm for keeping the robot upright, it might have a period of about the one we observe.</small>

<a name="f3">3</a>
<small>This might be a little confusing, since the robot looks like it's a rolling ball.
However, actually it is just the outer shell of the robot that rolls when the robot moves.
The actual robot itself inside the shell tends to stay at a pretty constant orientation while the shell rolls.</small>

<a name="f4">4</a>
<small>I found that I could really eliminate the false positives by reading the standard deviation in pre-determined chunks instead of continuously.
It often takes much longer than the chunk time - I found 3 seconds worked pretty well - to turn around when stuck.
However, the probability of a false positive is much lower than if the standard deviation is *continuously* monitored, as a false positive standard deviation would have to fit inside a pre-determined chunk, not *any* 3 second period.
</small>
