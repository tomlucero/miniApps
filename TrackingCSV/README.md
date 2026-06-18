# Tracking CSV Builder

Simple local web app for creating upload-ready tracking CSV files.

## Use

Open `index.html` in a browser, enter one packing list ID and tracking number per row, then click **Download CSV**.

The downloaded file matches the provided sample format:

```csv
"6171706","9114902307224980232042"
```

There is no header row. Tracking numbers are uppercased and spaces or dashes are removed so pasted USPS, UPS, FedEx, domestic, and international formats are easier to clean up.
