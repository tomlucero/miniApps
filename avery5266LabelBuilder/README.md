# Avery 5266 Folder Label Builder

A small local browser app for building printable folder-label ranges on Avery 5266 label sheets.

## What It Does

The app creates labels in number ranges, such as:

```text
210000 - 210049
210050 - 210099
210100 - 210149
```

It is designed for Avery 5266 file folder labels:

- 30 labels per sheet
- 2 columns
- 15 rows
- 2/3 in. x 3-7/16 in. labels

## Quick Start

1. Open `index.html` in a browser.
2. Enter the starting number.
3. Keep `Numbers Per Label` at `50` for groups like `210000 - 210049`.
4. Enter how many labels you need.
5. Click `Print Labels`.

When printing, use:

- Paper size: Letter
- Scale: 100% or Actual Size
- Margins: None, if your print dialog offers that option

## Fields

- `Starting Number`: the first number in the first range.
- `Numbers Per Label`: how many numbers each folder-label range covers.
- `Number of Labels`: how many label ranges to generate.
- `Starting Row`: which row to begin printing on, useful for partially used label sheets.
- `Starting Column`: which column to begin printing on. Labels fill left-to-right, then continue down the sheet.
- `Prefix Text`: optional text before every range.
- `Suffix Text`: optional text after every range.
- `Font Size`, `Font Weight`, and `Text Align`: basic print formatting controls.
- `Top Offset` and `Left Offset`: small printer calibration controls, measured in inches.

## Printer Calibration

Printers can shift output slightly. If labels print too high, increase `Top Offset`. If they print too far left, increase `Left Offset`.

Start with small changes such as:

```text
0.03
```

Always test on plain paper first, then hold the sheet behind a real Avery 5266 sheet to check alignment.

## Local Only

This app runs entirely in the browser. It does not call any external API. Bootstrap and the header image load from the web when available.
