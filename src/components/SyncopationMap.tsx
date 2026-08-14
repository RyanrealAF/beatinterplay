import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { WordTiming, LyricItem } from '../types';
import { Zap, Target, Sliders, Info, ZoomIn, ZoomOut, RotateCcw, Activity } from 'lucide-react';

interface SyncopationMapProps {
  words: WordTiming[];
  downbeats?: number[];
  beatGrid?: number[];
  bpm: number;
  duration: number;
  currentTime: number;
  onSeek: (timeSec: number) => void;
}

interface ProcessedWord extends WordTiming {
  nearestDownbeat: number;
  downbeatDistSec: number;
  downbeatDistMs: number;
  nearestBeat: number;
  beatDistMs: number;
  isSyncopated: boolean; // Stressed and off-beat by > 35ms
  syncopationType: 'downbeat-aligned' | 'anticipated' | 'laid-back-offbeat' | 'unstressed-flow';
}

export const SyncopationMap: React.FC<SyncopationMapProps> = ({
  words,
  downbeats: propDownbeats,
  beatGrid: propBeatGrid,
  bpm,
  duration,
  currentTime,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter & Zoom State
  const [filterMode, setFilterMode] = useState<'all' | 'stressed' | 'syncopated'>('all');
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
  const [followPlayhead, setFollowPlayhead] = useState(false);
  const [hoveredWord, setHoveredWord] = useState<ProcessedWord | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute effective beat grid and downbeats if not provided
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  const downbeats = useMemo(() => {
    if (propDownbeats && propDownbeats.length > 0) return propDownbeats;
    const list: number[] = [];
    const firstBeat = words.length > 0 ? Math.max(0, words[0].start - (words[0].start % barSec)) : 0;
    const maxTime = Math.max(duration, words.length > 0 ? words[words.length - 1].end + 2 : 24);
    for (let t = firstBeat; t <= maxTime; t += barSec) {
      list.push(parseFloat(t.toFixed(3)));
    }
    return list;
  }, [propDownbeats, bpm, duration, words, barSec]);

  const beatGrid = useMemo(() => {
    if (propBeatGrid && propBeatGrid.length > 0) return propBeatGrid;
    const list: number[] = [];
    const firstBeat = downbeats.length > 0 ? downbeats[0] : 0;
    const maxTime = Math.max(duration, words.length > 0 ? words[words.length - 1].end + 2 : 24);
    for (let t = firstBeat; t <= maxTime; t += beatSec) {
      list.push(parseFloat(t.toFixed(3)));
    }
    return list;
  }, [propBeatGrid, downbeats, bpm, duration, words, beatSec]);

  // Process words with syncopation metrics
  const processedWords: ProcessedWord[] = useMemo(() => {
    return words.map((w) => {
      // Find nearest downbeat
      let nearestDb = downbeats[0] || 0;
      let minDbDist = Infinity;
      downbeats.forEach((db) => {
        const dist = Math.abs(w.start - db);
        if (dist < minDbDist) {
          minDbDist = dist;
          nearestDb = db;
        }
      });

      // Find nearest beat in grid
      let nearestB = beatGrid[0] || 0;
      let minBeatDist = Infinity;
      beatGrid.forEach((b) => {
        const dist = Math.abs(w.start - b);
        if (dist < minBeatDist) {
          minBeatDist = dist;
          nearestB = b;
        }
      });

      const downbeatDistSec = w.start - nearestDb;
      const downbeatDistMs = downbeatDistSec * 1000;
      const beatDistSec = w.start - nearestB;
      const beatDistMs = beatDistSec * 1000;

      // Syncopation classification: Stressed words that hit off downbeat / off-grid
      const isSyncopated = w.stressed && Math.abs(beatDistMs) > 40;

      let syncopationType: ProcessedWord['syncopationType'] = 'unstressed-flow';
      if (w.stressed) {
        if (Math.abs(downbeatDistMs) <= 45) {
          syncopationType = 'downbeat-aligned';
        } else if (downbeatDistMs < 0) {
          syncopationType = 'anticipated';
        } else {
          syncopationType = 'laid-back-offbeat';
        }
      }

      return {
        ...w,
        nearestDownbeat: nearestDb,
        downbeatDistSec,
        downbeatDistMs,
        nearestBeat: nearestB,
        beatDistMs,
        isSyncopated,
        syncopationType,
      };
    });
  }, [words, downbeats, beatGrid]);

  // Syncopation Analytics
  const stats = useMemo(() => {
    const totalWords = processedWords.length;
    const stressedWords = processedWords.filter((w) => w.stressed);
    const syncopatedCount = stressedWords.filter((w) => w.isSyncopated).length;
    const downbeatAccentCount = stressedWords.filter((w) => w.syncopationType === 'downbeat-aligned').length;
    const anticipatedCount = stressedWords.filter((w) => w.syncopationType === 'anticipated').length;
    const laidBackCount = stressedWords.filter((w) => w.syncopationType === 'laid-back-offbeat').length;
    const syncopationIndex = stressedWords.length > 0
      ? Math.round((syncopatedCount / stressedWords.length) * 100)
      : 0;

    const avgOffset = stressedWords.length > 0
      ? stressedWords.reduce((acc, w) => acc + w.micro_ms, 0) / stressedWords.length
      : 0;

    return {
      totalWords,
      stressedCount: stressedWords.length,
      syncopatedCount,
      downbeatAccentCount,
      anticipatedCount,
      laidBackCount,
      syncopationIndex,
      avgOffset,
    };
  }, [processedWords]);

  // Effective min/max time for D3 scale
  const totalMaxTime = useMemo(() => {
    const wordsMax = words.length > 0 ? Math.max(...words.map((w) => w.end)) + 1.5 : 22.5;
    const downbeatsMax = downbeats.length > 0 ? Math.max(...downbeats) + 1.5 : 22.5;
    return Math.max(duration, wordsMax, downbeatsMax, 22.5);
  }, [words, downbeats, duration]);

  const effectiveDomain: [number, number] = useMemo(() => {
    if (followPlayhead) {
      const windowSize = 6.0; // 6-second window centered around current time
      const minT = Math.max(0, currentTime - 1.5);
      const maxT = Math.min(totalMaxTime, minT + windowSize);
      return [minT, maxT];
    }
    if (zoomRange) return zoomRange;
    return [0, totalMaxTime];
  }, [zoomRange, followPlayhead, currentTime, totalMaxTime]);

  // Main D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 380;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 50, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Defs for gradients, glowing filters, and markers
    const defs = svg.append('defs');

    // Downbeat glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow-cyan')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const filterRed = defs.append('filter')
      .attr('id', 'glow-accent')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filterRed.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMergeRed = filterRed.append('feMerge');
    feMergeRed.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeRed.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear gradients
    const gradConnectorAnticipated = defs.append('linearGradient')
      .attr('id', 'grad-anticipated')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    gradConnectorAnticipated.append('stop').attr('offset', '0%').attr('stop-color', '#FF9900').attr('stop-opacity', 0.9);
    gradConnectorAnticipated.append('stop').attr('offset', '100%').attr('stop-color', '#FF2A55').attr('stop-opacity', 0.2);

    const gradConnectorLaidBack = defs.append('linearGradient')
      .attr('id', 'grad-laidback')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    gradConnectorLaidBack.append('stop').attr('offset', '0%').attr('stop-color', '#FF2A55').attr('stop-opacity', 0.9);
    gradConnectorLaidBack.append('stop').attr('offset', '100%').attr('stop-color', '#A855F7').attr('stop-opacity', 0.2);

    // X Scale
    const xScale = d3.scaleLinear()
      .domain(effectiveDomain)
      .range([0, innerWidth]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Swimlane Heights
    // Lane 1: Downbeat & Metric Ruler (Y: 0 to 60)
    // Lane 2: Syncopation Vector Arcs & Connectors (Y: 60 to 180)
    // Lane 3: Word Glyphs & Syllable Pills (Y: 180 to 270)
    const downbeatY = 30;
    const wordsBaseY = 220;

    // Background Subdivision Grid (16th notes)
    const gridG = g.append('g').attr('class', 'grid-lines');
    const subGridSec = beatSec / 4;
    const startSub = Math.floor(effectiveDomain[0] / subGridSec) * subGridSec;
    for (let t = startSub; t <= effectiveDomain[1]; t += subGridSec) {
      const x = xScale(t);
      if (x < 0 || x > innerWidth) continue;
      const isQuarter = Math.abs((t - (downbeats[0] || 0)) % beatSec) < 0.02;
      gridG.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', isQuarter ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)')
        .attr('stroke-dasharray', isQuarter ? 'none' : '2,4');
    }

    // Render Beat Ticks (1, 2, 3, 4)
    beatGrid.forEach((b, idx) => {
      if (b < effectiveDomain[0] - 0.2 || b > effectiveDomain[1] + 0.2) return;
      const x = xScale(b);
      const isDownbeat = downbeats.some((db) => Math.abs(db - b) < 0.05);
      if (!isDownbeat) {
        g.append('line')
          .attr('x1', x).attr('x2', x)
          .attr('y1', downbeatY - 10).attr('y2', downbeatY + 10)
          .attr('stroke', 'rgba(255, 255, 255, 0.25)')
          .attr('stroke-width', 1.5);

        const beatNum = (idx % 4) + 1;
        g.append('text')
          .attr('x', x)
          .attr('y', downbeatY - 14)
          .attr('text-anchor', 'middle')
          .attr('fill', '#64748B')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .text(`.${beatNum}`);
      }
    });

    // Render Downbeats (Strong Metric Anchors)
    const downbeatG = g.append('g').attr('class', 'downbeat-anchors');
    downbeats.forEach((db, idx) => {
      if (db < effectiveDomain[0] - 0.5 || db > effectiveDomain[1] + 0.5) return;
      const x = xScale(db);

      // Vertical Downbeat Pillar
      downbeatG.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', '#00E5FF')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.65);

      // Downbeat Anchor Circle at top
      downbeatG.append('circle')
        .attr('cx', x)
        .attr('cy', downbeatY)
        .attr('r', 9)
        .attr('fill', '#041c24')
        .attr('stroke', '#00E5FF')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow-cyan)')
        .attr('cursor', 'pointer')
        .on('click', () => onSeek(db));

      downbeatG.append('circle')
        .attr('cx', x)
        .attr('cy', downbeatY)
        .attr('r', 3)
        .attr('fill', '#00E5FF');

      // Bar Badge Label
      downbeatG.append('rect')
        .attr('x', x - 26)
        .attr('y', downbeatY - 32)
        .attr('width', 52)
        .attr('height', 16)
        .attr('rx', 3)
        .attr('fill', '#071822')
        .attr('stroke', '#00E5FF')
        .attr('stroke-width', 1);

      downbeatG.append('text')
        .attr('x', x)
        .attr('y', downbeatY - 21)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00E5FF')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'monospace')
        .text(`BAR ${idx + 1}`);
    });

    // Connecting Cadence Flow Ribbon across words
    const ribbonG = g.append('g').attr('class', 'cadence-ribbon');
    const filteredWords = processedWords.filter((w) => {
      if (filterMode === 'stressed') return w.stressed;
      if (filterMode === 'syncopated') return w.isSyncopated;
      return true;
    });

    if (filteredWords.length > 1) {
      const lineGen = d3.line<ProcessedWord>()
        .x((d) => xScale(d.start))
        .y((d) => wordsBaseY - (d.stressed ? 18 : 0))
        .curve(d3.curveMonotoneX);

      ribbonG.append('path')
        .datum(filteredWords)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.15)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3');
    }

    // Syncopation Vectors & Arcs (Connector between Stressed Words and Nearest Downbeat / On-beat)
    const vectorsG = g.append('g').attr('class', 'syncopation-vectors');

    processedWords.forEach((w) => {
      if (w.start < effectiveDomain[0] - 0.5 || w.start > effectiveDomain[1] + 0.5) return;
      if (filterMode === 'stressed' && !w.stressed) return;
      if (filterMode === 'syncopated' && !w.isSyncopated) return;

      const wordX = xScale(w.start);
      const wordY = wordsBaseY - (w.stressed ? 18 : 0);
      const targetDbX = xScale(w.nearestDownbeat);

      if (w.stressed) {
        if (w.syncopationType === 'downbeat-aligned') {
          // Direct Downbeat Lock (Greenish Cyan straight harmonic link)
          vectorsG.append('line')
            .attr('x1', wordX).attr('y1', wordY - 14)
            .attr('x2', targetDbX).attr('y2', downbeatY + 12)
            .attr('stroke', '#10B981')
            .attr('stroke-width', 2.5)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.85);

          // On-Beat Lock Pill Badge
          vectorsG.append('rect')
            .attr('x', wordX - 22)
            .attr('y', (wordY + downbeatY) / 2 - 8)
            .attr('width', 44)
            .attr('height', 16)
            .attr('rx', 4)
            .attr('fill', '#06281e')
            .attr('stroke', '#10B981')
            .attr('stroke-width', 1);

          vectorsG.append('text')
            .attr('x', wordX)
            .attr('y', (wordY + downbeatY) / 2 + 3)
            .attr('text-anchor', 'middle')
            .attr('fill', '#10B981')
            .attr('font-size', '8px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'monospace')
            .text('ON-BEAT');
        } else {
          // Syncopated Tension Curve (Bezier arc pulling across time to the nearest downbeat)
          const midX = (wordX + targetDbX) / 2;
          const arcControlY = downbeatY + 30; // curve belly
          const pathD = `M ${wordX} ${wordY - 14} Q ${midX} ${arcControlY} ${targetDbX} ${downbeatY + 10}`;

          const isAnticipated = w.syncopationType === 'anticipated';
          const strokeColor = isAnticipated ? '#FF8800' : '#FF2A55';

          vectorsG.append('path')
            .attr('d', pathD)
            .attr('fill', 'none')
            .attr('stroke', strokeColor)
            .attr('stroke-width', 2.2)
            .attr('stroke-dasharray', '5,3')
            .attr('opacity', 0.85);

          // Tension Delta Label Badge
          const badgeX = midX;
          const badgeY = (wordY + downbeatY) / 2 + 5;
          const offsetSign = w.downbeatDistMs > 0 ? `+${w.downbeatDistMs.toFixed(0)}ms` : `${w.downbeatDistMs.toFixed(0)}ms`;

          vectorsG.append('rect')
            .attr('x', badgeX - 30)
            .attr('y', badgeY - 8)
            .attr('width', 60)
            .attr('height', 16)
            .attr('rx', 4)
            .attr('fill', '#20050c')
            .attr('stroke', strokeColor)
            .attr('stroke-width', 1);

          vectorsG.append('text')
            .attr('x', badgeX)
            .attr('y', badgeY + 3)
            .attr('text-anchor', 'middle')
            .attr('fill', strokeColor)
            .attr('font-size', '8px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'monospace')
            .text(offsetSign);
        }
      }
    });

    // Word Glyphs & Syllable Elements (Bottom Lane)
    const wordsG = g.append('g').attr('class', 'word-glyphs');

    processedWords.forEach((w) => {
      if (w.start < effectiveDomain[0] - 0.5 || w.start > effectiveDomain[1] + 0.5) return;
      if (filterMode === 'stressed' && !w.stressed) return;
      if (filterMode === 'syncopated' && !w.isSyncopated) return;

      const x = xScale(w.start);
      const y = wordsBaseY - (w.stressed ? 18 : 0);
      const isHovered = hoveredWord?.text === w.text && hoveredWord?.start === w.start;
      const isWordActive = currentTime >= w.start && currentTime <= w.end;

      const nodeGroup = wordsG.append('g')
        .attr('transform', `translate(${x}, ${y})`)
        .attr('cursor', 'pointer')
        .on('click', () => onSeek(w.start))
        .on('mouseenter', (event) => {
          setHoveredWord(w);
          const rect = container.getBoundingClientRect();
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        })
        .on('mousemove', (event) => {
          const rect = container.getBoundingClientRect();
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        })
        .on('mouseleave', () => {
          setHoveredWord(null);
          setTooltipPos(null);
        });

      if (w.stressed) {
        // Stressed Accent Glyph (Diamond / Hexagon Accent Pill)
        const textLen = w.text.length * 7 + 22;
        const pillWidth = Math.max(48, textLen);
        const pillHeight = 26;

        // Outer glow on active
        if (isWordActive || isHovered) {
          nodeGroup.append('rect')
            .attr('x', -pillWidth / 2 - 4)
            .attr('y', -pillHeight / 2 - 4)
            .attr('width', pillWidth + 8)
            .attr('height', pillHeight + 8)
            .attr('rx', 8)
            .attr('fill', 'none')
            .attr('stroke', isWordActive ? '#00E5FF' : '#FF2A55')
            .attr('stroke-width', 2)
            .attr('filter', isWordActive ? 'url(#glow-cyan)' : 'url(#glow-accent)');
        }

        // Stressed Pill Background
        nodeGroup.append('rect')
          .attr('x', -pillWidth / 2)
          .attr('y', -pillHeight / 2)
          .attr('width', pillWidth)
          .attr('height', pillHeight)
          .attr('rx', 6)
          .attr('fill', isWordActive ? '#00E5FF' : '#2A0812')
          .attr('stroke', isWordActive ? '#00E5FF' : '#FF2A55')
          .attr('stroke-width', 2);

        // Accent Bolt Icon (visual marker in SVG)
        nodeGroup.append('polygon')
          .attr('points', `${-pillWidth / 2 + 7},-4 ${-pillWidth / 2 + 13},-4 ${-pillWidth / 2 + 9},2 ${-pillWidth / 2 + 15},2 ${-pillWidth / 2 + 6},8 ${-pillWidth / 2 + 8},0 ${-pillWidth / 2 + 4},0`)
          .attr('fill', isWordActive ? '#000' : '#FF2A55');

        // Word text
        nodeGroup.append('text')
          .attr('x', 4)
          .attr('y', 4)
          .attr('text-anchor', 'middle')
          .attr('fill', isWordActive ? '#000' : '#FFFFFF')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'sans-serif')
          .text(w.text);

        // Micro-offset tag below pill
        nodeGroup.append('text')
          .attr('x', 0)
          .attr('y', pillHeight / 2 + 12)
          .attr('text-anchor', 'middle')
          .attr('fill', w.micro_ms > 0 ? '#F59E0B' : '#06B6D4')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(`${w.micro_ms > 0 ? '+' : ''}${w.micro_ms.toFixed(0)}ms`);
      } else {
        // Unstressed Syllable Node (Minimal Pill / Dot)
        const textLen = w.text.length * 6 + 14;
        const pillWidth = Math.max(32, textLen);
        const pillHeight = 20;

        nodeGroup.append('rect')
          .attr('x', -pillWidth / 2)
          .attr('y', -pillHeight / 2)
          .attr('width', pillWidth)
          .attr('height', pillHeight)
          .attr('rx', 4)
          .attr('fill', isWordActive ? '#00E5FF' : '#0B0F15')
          .attr('stroke', isWordActive ? '#00E5FF' : 'rgba(255, 255, 255, 0.25)')
          .attr('stroke-width', 1);

        nodeGroup.append('text')
          .attr('x', 0)
          .attr('y', 3.5)
          .attr('text-anchor', 'middle')
          .attr('fill', isWordActive ? '#000' : '#94A3B8')
          .attr('font-size', '9px')
          .attr('font-family', 'sans-serif')
          .text(w.text);
      }
    });

    // Real-Time Playhead Laser Line
    if (currentTime >= effectiveDomain[0] && currentTime <= effectiveDomain[1]) {
      const playheadX = xScale(currentTime);
      const playheadG = g.append('g').attr('class', 'playhead');

      playheadG.append('line')
        .attr('x1', playheadX).attr('x2', playheadX)
        .attr('y1', 0).attr('y2', innerHeight)
        .attr('stroke', '#00E5FF')
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#glow-cyan)');

      // Playhead beacon head
      playheadG.append('polygon')
        .attr('points', `${playheadX - 6},0 ${playheadX + 6},0 ${playheadX},10`)
        .attr('fill', '#00E5FF');
    }

    // Time Axis (X-Bottom)
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(12, Math.floor(innerWidth / 70)))
      .tickFormat((d) => {
        const sec = d as number;
        const mins = Math.floor(sec / 60);
        const remSec = (sec % 60).toFixed(1);
        return `${mins}:${parseFloat(remSec) < 10 ? '0' : ''}${remSec}`;
      });

    const axisG = g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    axisG.selectAll('text')
      .attr('fill', '#64748B')
      .attr('font-family', 'monospace')
      .attr('font-size', '9px');
    axisG.selectAll('line').attr('stroke', 'rgba(255, 255, 255, 0.15)');
    axisG.select('.domain').attr('stroke', 'rgba(255, 255, 255, 0.2)');

    // Swimlane Legends / Y-Labels
    g.append('text')
      .attr('x', -35)
      .attr('y', downbeatY + 3)
      .attr('fill', '#00E5FF')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('GRID');

    g.append('text')
      .attr('x', -35)
      .attr('y', wordsBaseY + 3)
      .attr('fill', '#FF2A55')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('FLOW');

  }, [
    processedWords,
    downbeats,
    beatGrid,
    effectiveDomain,
    currentTime,
    filterMode,
    hoveredWord,
    onSeek,
    beatSec,
  ]);

  // Quick Measure Zoom Helpers
  const handleZoomPreset = (startBar: number, endBar: number) => {
    setFollowPlayhead(false);
    const startSec = Math.max(0, (startBar - 1) * barSec);
    const endSec = Math.min(totalMaxTime, endBar * barSec);
    setZoomRange([startSec, endSec]);
  };

  const handleResetZoom = () => {
    setFollowPlayhead(false);
    setZoomRange(null);
  };

  return (
    <div
      id="syncopation-map-card"
      ref={containerRef}
      className="bg-[#0d0d10] border border-white/10 rounded-xl p-4 flex flex-col font-mono text-xs shadow-2xl relative space-y-4"
    >
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF2A55]/10 border border-[#FF2A55]/30 flex items-center justify-center text-[#FF2A55]">
            <Target className="w-4 h-4 text-[#FF2A55]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-[0.14em] text-xs">
                SYNCOPATION & CADENCE MAP (D3)
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-[#FF2A55]/15 text-[#FF2A55] border border-[#FF2A55]/30 font-bold uppercase">
                STRESSED VS DOWNBEAT
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              Metric displacement vectors of stressed syllables mapped against {bpm} BPM downbeat anchors
            </p>
          </div>
        </div>

        {/* Filters & Zoom Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Filter Mode Selector */}
          <div className="flex bg-black/80 rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                filterMode === 'all' ? 'bg-[#00E5FF] text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Words ({stats.totalWords})
            </button>
            <button
              onClick={() => setFilterMode('stressed')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1 ${
                filterMode === 'stressed' ? 'bg-[#FF2A55] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              Stressed ({stats.stressedCount})
            </button>
            <button
              onClick={() => setFilterMode('syncopated')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                filterMode === 'syncopated' ? 'bg-amber-400 text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              Syncopated ({stats.syncopatedCount})
            </button>
          </div>

          {/* Quick Zoom Bar Presets */}
          <div className="flex items-center bg-black/80 rounded-lg border border-white/10 p-0.5 gap-1">
            <button
              onClick={() => handleZoomPreset(1, 4)}
              className="px-2 py-1 text-[9px] text-gray-300 hover:text-white hover:bg-white/5 rounded font-bold"
              title="Zoom to Bars 1 - 4"
            >
              BAR 1-4
            </button>
            <button
              onClick={() => handleZoomPreset(5, 8)}
              className="px-2 py-1 text-[9px] text-gray-300 hover:text-white hover:bg-white/5 rounded font-bold"
              title="Zoom to Bars 5 - 8"
            >
              BAR 5-8
            </button>
            <button
              onClick={() => handleZoomPreset(9, 12)}
              className="px-2 py-1 text-[9px] text-gray-300 hover:text-white hover:bg-white/5 rounded font-bold"
              title="Zoom to Bars 9 - 12"
            >
              BAR 9-12
            </button>
            <button
              onClick={handleResetZoom}
              className={`px-2 py-1 text-[9px] rounded font-bold transition-colors ${
                !zoomRange && !followPlayhead ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Show Full Track"
            >
              ALL
            </button>
          </div>

          {/* Follow Playhead Toggle */}
          <button
            onClick={() => {
              setFollowPlayhead(!followPlayhead);
              if (!followPlayhead) setZoomRange(null);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
              followPlayhead
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/50 shadow-[0_0_8px_rgba(0,229,255,0.2)]'
                : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            <Activity className={`w-3 h-3 ${followPlayhead ? 'animate-spin' : ''}`} />
            AUTO-FOLLOW
          </button>
        </div>
      </div>

      {/* Syncopation Metric Intelligence HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/60 border border-white/10 rounded-lg p-3">
        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
            SYNCOPATION INDEX
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-amber-400">{stats.syncopationIndex}%</span>
            <span className="text-[10px] text-gray-500 font-mono">OFF-BEAT ACCENTS</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
            DOWNBEAT ALIGNMENT
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#10B981]">{stats.downbeatAccentCount}</span>
            <span className="text-[10px] text-gray-500 font-mono">LOCKED / {stats.stressedCount}</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
            ANTICIPATION PUSH (-MS)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#FF8800]">{stats.anticipatedCount}</span>
            <span className="text-[10px] text-gray-500 font-mono">EARLY HITS</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">
            AVG MICRO-TIMING DRIFT
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold ${stats.avgOffset >= 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {stats.avgOffset > 0 ? `+${stats.avgOffset.toFixed(1)}` : stats.avgOffset.toFixed(1)}ms
            </span>
            <span className="text-[10px] text-gray-500 font-mono">POCKET OFFSET</span>
          </div>
        </div>
      </div>

      {/* Main D3 SVG Stage */}
      <div className="w-full overflow-hidden bg-black/90 rounded-lg border border-white/10 relative shadow-inner">
        <svg ref={svgRef} className="w-full block select-none" />

        {/* Hover Tooltip Overlay */}
        {hoveredWord && tooltipPos && (
          <div
            className="absolute pointer-events-none z-30 bg-[#0B0F15]/95 border border-[#FF2A55]/40 rounded-lg p-3 shadow-2xl backdrop-blur-md text-[11px] font-mono space-y-1.5 min-w-[200px]"
            style={{
              left: `${Math.min(containerRef.current ? containerRef.current.clientWidth - 220 : 600, Math.max(10, tooltipPos.x + 15))}px`,
              top: `${Math.max(10, tooltipPos.y - 120)}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                {hoveredWord.stressed && <Zap className="w-3 h-3 text-[#FF2A55]" />}
                "{hoveredWord.text}"
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                hoveredWord.stressed
                  ? 'bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/40'
                  : 'bg-white/10 text-gray-400'
              }`}>
                {hoveredWord.stressed ? 'STRESSED ACCENT' : 'UNSTRESSED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-300">
              <div>
                <span className="text-gray-500 block">START:</span>
                <span className="text-white font-bold">{hoveredWord.start.toFixed(3)}s</span>
              </div>
              <div>
                <span className="text-gray-500 block">DURATION:</span>
                <span className="text-white font-bold">{((hoveredWord.end - hoveredWord.start) * 1000).toFixed(0)}ms</span>
              </div>
              <div>
                <span className="text-gray-500 block">MICRO-TIMING:</span>
                <span className={`font-bold ${hoveredWord.micro_ms > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {hoveredWord.micro_ms > 0 ? `+${hoveredWord.micro_ms.toFixed(1)}` : hoveredWord.micro_ms.toFixed(1)}ms
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">NEAREST DOWNBEAT:</span>
                <span className="text-white font-bold">{hoveredWord.nearestDownbeat.toFixed(3)}s</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-1 text-[9px]">
              <span className="text-gray-400 block uppercase">CADENCE ALIGNMENT:</span>
              <span className={`font-bold ${
                hoveredWord.syncopationType === 'downbeat-aligned'
                  ? 'text-emerald-400'
                  : hoveredWord.syncopationType === 'anticipated'
                  ? 'text-orange-400'
                  : 'text-[#FF2A55]'
              }`}>
                {hoveredWord.syncopationType === 'downbeat-aligned' && 'LOCKED DOWNBEAT ACCENT (ON-BEAT)'}
                {hoveredWord.syncopationType === 'anticipated' && `ANTICIPATED EARLY HIT (${Math.abs(hoveredWord.downbeatDistMs).toFixed(0)}ms before downbeat)`}
                {hoveredWord.syncopationType === 'laid-back-offbeat' && `LAID-BACK SYNCOPATION (+${hoveredWord.downbeatDistMs.toFixed(0)}ms off downbeat)`}
                {hoveredWord.syncopationType === 'unstressed-flow' && 'FLOWING UNSTRESSED SYLLABLE'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Visual Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-white/5 gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
            Downbeat Anchors (1st Beat)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#FF2A55] text-white flex items-center justify-center text-[8px] font-bold">
              <Zap className="w-2 h-2" />
            </span>
            Stressed Words (Accents)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-white/20" />
            Unstressed Syllables
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#10B981]" />
            Locked Downbeat Accent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-[#FF8800]" />
            Syncopated Tension Arc
          </span>
        </div>
        <span className="text-gray-500 font-mono">
          CLICK ANY WORD OR DOWNBEAT TO JUMP PLAYHEAD
        </span>
      </div>
    </div>
  );
};
