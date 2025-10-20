
# Node JS

Node js. Generator and analyzer for logs



## How to run code
Generate
```bash
    npm run generate

```

Generates random log entries based on time.

Every minute, create a new folder.

Every 10 seconds, create a new log file inside the current folder.


Analyze:
```bash
    npm run analyze
```

Analyzes the generated logs and calculates statistics such as the number of successful logs, error logs, etc.

Supports a CLI parameter to filter logs by type (e.g., success, error).


How to filter by type of logs:

```bash
    npm run analyze:type

```

Help:

```bash
    npm run help

```



