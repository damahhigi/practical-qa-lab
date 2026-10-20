(() => {
  'use strict';

  // Fictional, in-memory teaching data. Nothing is uploaded or sent to a server.
  const PRACTICE_DATABASE = {
    customers: [
      { id: 101, name: 'Jane Wanjiku', email: 'jane@example.com', city: 'Nairobi', status: 'active' },
      { id: 102, name: 'Kevin Mwangi', email: 'kevin@example.com', city: 'Nakuru', status: 'active' },
      { id: 103, name: 'Amina Otieno', email: 'amina@example.com', city: 'Mombasa', status: 'inactive' },
      { id: 104, name: 'Brian Kiptoo', email: 'brian@example.com', city: 'Eldoret', status: 'active' },
      { id: 105, name: 'Grace Njeri', email: 'grace@example.com', city: 'Nairobi', status: 'active' },
      { id: 106, name: 'Peter Ouma', email: 'peter@example.com', city: 'Kisumu', status: 'inactive' }
    ],
    orders: [
      { id: 5001, customer_id: 101, total: 2500, status: 'paid', created_at: '2026-09-01' },
      { id: 5002, customer_id: 101, total: 850, status: 'pending', created_at: '2026-09-02' },
      { id: 5003, customer_id: 102, total: 1200, status: 'paid', created_at: '2026-09-03' },
      { id: 5004, customer_id: 104, total: 3990, status: 'cancelled', created_at: '2026-09-04' },
      { id: 5005, customer_id: 105, total: 1990, status: 'paid', created_at: '2026-09-05' },
      { id: 5006, customer_id: 103, total: 1750, status: 'pending', created_at: '2026-09-06' },
      { id: 5007, customer_id: 105, total: 540, status: 'paid', created_at: '2026-09-07' },
      { id: 5008, customer_id: 102, total: 900, status: 'pending', created_at: '2026-09-08' }
    ]
  };

  // Investigation data is a separate in-memory copy: Stage 1's original records stay unchanged.
  const INVESTIGATION_DATABASE = {
    customers: [
      ...PRACTICE_DATABASE.customers,
      { id: 107, name: 'Mary Achieng', email: 'jane@example.com', city: 'Kisii', status: 'active' }
    ],
    orders: [
      ...PRACTICE_DATABASE.orders,
      { id: 5009, customer_id: 999, total: 1400, status: 'paid', created_at: '2026-09-09' },
      { id: 5010, customer_id: 102, total: -350, status: 'paid', created_at: '2026-09-10' }
    ]
  };
  let DATABASE = PRACTICE_DATABASE;
  const HINT_QUERIES = {
    totals: 'SELECT id, customer_id, total, status\nFROM orders\nORDER BY total ASC;',
    ownership: 'SELECT id, customer_id, total\nFROM orders\nORDER BY customer_id ASC;',
    emails: 'SELECT id, name, email\nFROM customers\nORDER BY email ASC;'
  };
  const CASE_LABELS = { totals: 'Case 01 — Order totals', ownership: 'Case 02 — Order ownership', emails: 'Case 03 — Customer emails' };
  const REPORTS_KEY = 'practical-qa-sql-validation-reports-v1';

  // Stage 4: completed SQL reviews share the existing My Progress history.
  // Bug report drafts remain independent under REPORTS_KEY.
  const HOME_PROGRESS_STORAGE_KEY = 'practicalQaLab.progress.v1';
  const HOME_PROGRESS_AREA = 'sqlvalidation';
  const HOME_PROGRESS_HISTORY_LIMIT = 250;


  const EXAMPLES = {
    all: 'SELECT *\nFROM customers;',
    active: "SELECT id, name, email, city\nFROM customers\nWHERE status = 'active';",
    sorting: 'SELECT id, customer_id, total, status\nFROM orders\nORDER BY total DESC;',
    filter: 'SELECT id, customer_id, total\nFROM orders\nWHERE total > 1000\nORDER BY total DESC;',
    join: 'SELECT customers.name, orders.id, orders.total, orders.status\nFROM customers\nINNER JOIN orders ON customers.id = orders.customer_id\nORDER BY orders.total DESC;',
    and: "SELECT id, customer_id, total, status\nFROM orders\nWHERE status = 'paid' AND total > 1000\nORDER BY total DESC;",
    or: "SELECT id, name, city\nFROM customers\nWHERE city = 'Nairobi' OR city = 'Mombasa'\nORDER BY id ASC;",
    grouped: "SELECT id, customer_id, total, status\nFROM orders\nWHERE (status = 'paid' OR status = 'pending') AND total > 1000\nORDER BY id ASC;",
    count: 'SELECT COUNT(*) AS order_count\nFROM orders;',
    sum: "SELECT SUM(total) AS paid_revenue\nFROM orders\nWHERE status = 'paid';",
    avg: "SELECT AVG(total) AS average_paid_total\nFROM orders\nWHERE status = 'paid';",
    groupby: 'SELECT status, COUNT(*) AS order_count\nFROM orders\nGROUP BY status\nORDER BY order_count DESC;',
    duplicates: 'SELECT email, COUNT(*) AS duplicate_count\nFROM customers\nGROUP BY email\nHAVING COUNT(*) > 1\nORDER BY duplicate_count DESC;',
    repeatedstatus: 'SELECT status, COUNT(*) AS order_count\nFROM orders\nGROUP BY status\nHAVING order_count >= 2\nORDER BY order_count DESC;',
    customerswithoutorders: 'SELECT customers.id, customers.name\nFROM customers\nLEFT JOIN orders ON customers.id = orders.customer_id\nWHERE orders.id IS NULL\nORDER BY customers.id ASC;',
    orderswithoutcustomers: 'SELECT orders.id, orders.customer_id, orders.total\nFROM orders\nLEFT JOIN customers ON orders.customer_id = customers.id\nWHERE customers.id IS NULL\nORDER BY orders.id ASC;'
  };

  function fail(message) { throw new Error(message); }

  function availableColumns(table) { return Object.keys(DATABASE[table][0]); }

  function resolveColumn(input, tables) {
    const raw = input.trim();
    const parts = raw.toLowerCase().split('.');
    if (parts.length > 2 || parts.some(part => !/^[a-z_][a-z0-9_]*$/.test(part))) {
      fail(`Unsupported column expression: ${raw}. Use a column name such as name or orders.total.`);
    }
    if (parts.length === 2) {
      const [table, field] = parts;
      if (!tables.includes(table)) fail(`The table "${table}" is not part of this query.`);
      if (!availableColumns(table).includes(field)) fail(`Unknown column "${raw}".`);
      return { table, field };
    }
    const field = parts[0];
    const matches = tables.filter(table => availableColumns(table).includes(field));
    if (matches.length === 0) fail(`Unknown column "${raw}".`);
    if (matches.length > 1) fail(`Column "${raw}" is ambiguous. Use customers.${field} or orders.${field}.`);
    return { table: matches[0], field };
  }

  // LEFT JOIN supplies a NULL right-hand record when nothing matches.
  function valueFor(row, column) { return row[column.table]?.[column.field] ?? null; }

  function parseCondition(input, tables) {
    // SQL checks for missing join matches with IS NULL / IS NOT NULL,
    // not = NULL. These predicates also work inside AND / OR expressions.
    const nullCheck = input.trim().match(/^([a-z_][\w.]*)\s+IS\s+(NOT\s+)?NULL$/i);
    if (nullCheck) {
      const column = resolveColumn(nullCheck[1], tables);
      return nullCheck[2]
        ? row => valueFor(row, column) !== null
        : row => valueFor(row, column) === null;
    }
    const match = input.trim().match(/^([a-z_][\w.]*)\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*('(?:[^']|'')*'|"[^"]*"|-?\d+(?:\.\d+)?|true|false|null)$/i);
    if (!match) {
      fail("WHERE supports comparisons such as status = 'active' or total > 1000, combined with AND / OR and parentheses.");
    }
    const column = resolveColumn(match[1], tables);
    const operator = match[2].toUpperCase();
    const literal = match[3];
    let expected;
    if (literal[0] === "'") expected = literal.slice(1, -1).replace(/''/g, "'");
    else if (literal[0] === '"') expected = literal.slice(1, -1);
    else if (/^(true|false)$/i.test(literal)) expected = literal.toLowerCase() === 'true';
    else if (/^null$/i.test(literal)) expected = null;
    else expected = Number(literal);
    return row => {
      const actual = valueFor(row, column);
      if (operator === 'LIKE') {
        if (typeof expected !== 'string') fail('LIKE requires a quoted text pattern.');
        const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
        return new RegExp(`^${escaped}$`, 'i').test(String(actual ?? ''));
      }
      // SQL comparisons with NULL do not match; use IS NULL instead.
      if (actual === null || expected === null) return false;
      if (operator === '=') return actual === expected;
      if (operator === '!=' || operator === '<>') return actual !== expected;
      // Numeric operators compare numbers as numbers. Text is compared lexically.
      if (typeof actual !== typeof expected) return false;
      switch (operator) {
        case '>': return actual > expected;
        case '>=': return actual >= expected;
        case '<': return actual < expected;
        case '<=': return actual <= expected;
        default: return false;
      }
    };
  }

  // Stage 5 (part 1): parse read-only boolean WHERE expressions. AND binds
  // more strongly than OR, as in SQL. Parentheses explicitly group conditions.
  // Quoted literals are never split on AND/OR (e.g. city = 'Rock AND Roll').
  function parseWhereExpression(expression, tables) {
    const tokens = [];
    let part = '';
    let quote = null;
    const flushPredicate = () => {
      if (part.trim()) tokens.push({ type: 'predicate', text: part.trim() });
      part = '';
    };
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      if (quote) {
        part += char;
        if (char === quote) {
          if (expression[i + 1] === quote) {
            part += expression[++i]; // SQL-style doubled quote
          } else {
            quote = null;
          }
        }
        continue;
      }
      if (char === '\'' || char === '"') {
        quote = char;
        part += char;
        continue;
      }
      if (char === '(' || char === ')') {
        flushPredicate();
        tokens.push({ type: char });
        continue;
      }
      const connector = expression.slice(i).match(/^(AND|OR)\b/i);
      if (connector && (i === 0 || !/[a-z_0-9]/i.test(expression[i - 1]))) {
        flushPredicate();
        tokens.push({ type: connector[1].toUpperCase() });
        i += connector[1].length - 1;
        continue;
      }
      part += char;
    }
    if (quote) fail('WHERE contains an unfinished quoted string.');
    flushPredicate();
    if (tokens.length > 64) fail('Use 64 or fewer WHERE expression parts in this practice lab.');

    let position = 0;
    function parsePrimary() {
      const token = tokens[position++];
      if (!token) fail('WHERE needs a comparison after AND or OR.');
      if (token.type === '(') {
        const clause = parseOr();
        if (tokens[position]?.type !== ')') fail('WHERE has a missing closing parenthesis.');
        position++;
        return clause;
      }
      if (token.type !== 'predicate') fail('WHERE has an invalid or missing comparison.');
      return parseCondition(token.text, tables);
    }
    function parseAnd() {
      let left = parsePrimary();
      while (tokens[position]?.type === 'AND') {
        position++;
        const right = parsePrimary();
        const previous = left;
        left = row => previous(row) && right(row);
      }
      return left;
    }
    function parseOr() {
      let left = parseAnd();
      while (tokens[position]?.type === 'OR') {
        position++;
        const right = parseAnd();
        const previous = left;
        left = row => previous(row) || right(row);
      }
      return left;
    }
    const filter = parseOr();
    if (position !== tokens.length) {
      fail('WHERE expression has extra text or an unmatched parenthesis.');
    }
    return filter;
  }

  function addStage5LearningExamples() {
    const examples = document.querySelector('.example-list');
    const help = document.getElementById('queryHelp');
    if (!examples || !help) return;
    for (const [key, title, note] of [
      ['and', 'Paid orders over 1,000', 'AND'],
      ['or', 'Nairobi or Mombasa', 'OR'],
      ['grouped', 'Grouped order filters', '( ) + AND / OR'],
      ['count', 'Count all orders', 'COUNT(*)'],
      ['sum', 'Paid order revenue', 'SUM(total)'],
      ['avg', 'Average paid order', 'AVG(total)'],
      ['groupby', 'Orders by status', 'GROUP BY + COUNT'],
      ['duplicates', 'Duplicate customer emails', 'HAVING + COUNT'],
      ['repeatedstatus', 'Statuses with 2+ orders', 'HAVING + alias'],
      ['customerswithoutorders', 'Customers without orders', 'LEFT JOIN + IS NULL'],
      ['orderswithoutcustomers', 'Orders without customers', 'LEFT JOIN + IS NULL']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'example-button';
      button.dataset.example = key;
      button.append(document.createTextNode(title + ' '));
      const small = document.createElement('small');
      small.textContent = note;
      button.append(small);
      examples.append(button);
    }
    help.textContent = 'Supported: SELECT, WHERE (AND / OR, parentheses, IS NULL / IS NOT NULL), COUNT, SUM, AVG, GROUP BY (one column), HAVING (one aggregate comparison), ORDER BY, INNER JOIN, LEFT JOIN and LIMIT. One read-only query at a time. Press Ctrl/⌘ + Enter to run.';
    const tip = document.createElement('p');
    tip.className = 'result-note';
    tip.textContent = 'Stage 5 · Part 4: LEFT JOIN keeps unmatched rows from the left table, filling right-table fields with NULL. Filter with IS NULL to investigate missing relationships.';
    examples.parentElement.append(tip);
  }

  // Stage 5 (part 3): HAVING supports one aggregate comparison with a numeric
  // literal, e.g. HAVING COUNT(*) > 1 or HAVING order_count >= 2.
  // It runs after WHERE and GROUP BY; no arbitrary JavaScript or SQL execution.
  function aggregateValue(item, members) {
    if (item.operation === 'COUNT' && !item.source) return members.length;
    const data = members.map(row => valueFor(row, item.source))
      .filter(value => value !== null && value !== undefined);
    if (item.operation === 'COUNT') return data.length;
    if (!data.length) return null; // SUM/AVG of an empty result yields NULL.
    const total = data.reduce((sum, value) => sum + value, 0);
    if (item.operation === 'SUM') return total;
    return Number((total / data.length).toFixed(2));
  }

  function parseHavingComparison(input, tables, selections) {
    const parsed = input.trim().match(/^((?:(?:COUNT|SUM|AVG)\s*\(\s*(?:\*|[a-z_][\w.]*)\s*\))|[a-z_][\w]*)\s*(=|!=|<>|>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/i);
    if (!parsed) fail('HAVING supports one comparison like COUNT(*) > 1 or order_count >= 2. AND / OR in HAVING are not supported yet.');
    const left = parsed[1];
    const operator = parsed[2];
    const threshold = Number(parsed[3]);
    let metric;
    const aggregate = left.match(/^(COUNT|SUM|AVG)\s*\(\s*(\*|[a-z_][\w.]*)\s*\)$/i);
    if (aggregate) {
      const operation = aggregate[1].toUpperCase();
      const arg = aggregate[2];
      if (arg === '*' && operation !== 'COUNT') fail(`${operation}(*) is invalid. Choose a numeric column instead.`);
      const source = arg === '*' ? null : resolveColumn(arg, tables);
      if ((operation === 'SUM' || operation === 'AVG') && typeof DATABASE[source.table][0][source.field] !== 'number') {
        fail(`${operation} requires a numeric column; ${arg} contains text.`);
      }
      metric = { operation, source };
    } else {
      metric = selections.find(item => item.kind === 'aggregate' && item.label.toLowerCase() === left.toLowerCase());
      if (!metric) fail(`HAVING alias "${left}" must refer to a selected COUNT(), SUM() or AVG() result.`);
    }
    return group => {
      const value = aggregateValue(metric, group.members);
      if (value == null) return false;
      switch (operator) {
        case '=': return value === threshold;
        case '!=': case '<>': return value !== threshold;
        case '>': return value > threshold;
        case '>=': return value >= threshold;
        case '<': return value < threshold;
        case '<=': return value <= threshold;
        default: return false;
      }
    };
  }

  // Limited, read-only aggregate SQL simulator (not a full SQL engine).
  function runSelect(sqlText) {
    const cleaned = sqlText.trim().replace(/;\s*$/, '').replace(/\s+/g, ' ').trim();
    if (!cleaned) fail('Enter a SQL query to run.');
    if (cleaned.includes(';')) fail('Run one SQL statement at a time.');
    if (!/^SELECT\b/i.test(cleaned)) fail('This lab is read-only. Start with a SELECT statement.');

    const pattern = /^SELECT\s+(.+?)\s+FROM\s+(customers|orders)(?:\s+(?:INNER|LEFT)\s+JOIN\s+(customers|orders)\s+ON\s+([a-z_][\w.]*)\s*=\s*([a-z_][\w.]*))?(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+([a-z_][\w.]*))?(?:\s+HAVING\s+(.+?))?(?:\s+ORDER\s+BY\s+([a-z_][\w.]*)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i;
    const parsed = cleaned.match(pattern);
    if (!parsed) {
      fail('Unsupported SQL syntax. Try SELECT, WHERE (including IS NULL), COUNT/SUM/AVG, GROUP BY, HAVING, ORDER BY, INNER JOIN, LEFT JOIN or LIMIT. Table aliases and subqueries are not supported.');
    }
    const base = parsed[2].toLowerCase();
    const joined = parsed[3]?.toLowerCase() || null;
    const joinKind = joined && /\bLEFT\s+JOIN\s+(?:customers|orders)\s+ON\b/i.test(cleaned) ? 'LEFT' : 'INNER';
    const tables = joined ? [base, joined] : [base];
    if (joined === base) fail('Join the two different tables: customers and orders.');

    let rows = DATABASE[base].map(record => ({ [base]: record }));
    if (joined) {
      const left = resolveColumn(parsed[4], tables);
      const right = resolveColumn(parsed[5], tables);
      if (left.table === right.table) fail('The JOIN condition must connect columns from both tables.');
      const matches = [];
      for (const baseRow of rows) {
        let foundMatch = false;
        for (const joinedRecord of DATABASE[joined]) {
          const candidate = { ...baseRow, [joined]: joinedRecord };
          const leftValue = valueFor(candidate, left);
          const rightValue = valueFor(candidate, right);
          if (leftValue !== null && rightValue !== null && leftValue === rightValue) {
            matches.push(candidate);
            foundMatch = true;
          }
        }
        if (joinKind === 'LEFT' && !foundMatch) {
          // Retain the left row; right-hand fields render as SQL NULL.
          matches.push({ ...baseRow, [joined]: null });
        }
      }
      rows = matches;
    }
    if (parsed[6]) {
      const condition = parseWhereExpression(parsed[6], tables);
      rows = rows.filter(condition);
    }

    const selection = parsed[1].trim();
    const parts = selection.split(',').map(part => part.trim());
    if (parts.some(part => !part)) fail('SELECT contains an empty column.');
    const selections = [];
    for (const part of parts) {
      const aggregate = part.match(/^(COUNT|SUM|AVG)\s*\(\s*(\*|[a-z_][\w.]*)\s*\)(?:\s+AS\s+([a-z_][\w]*))?$/i);
      if (aggregate) {
        const operation = aggregate[1].toUpperCase();
        const arg = aggregate[2];
        if (arg === '*' && operation !== 'COUNT') fail(`${operation}(*) is invalid. Choose a numeric column instead.`);
        const source = arg === '*' ? null : resolveColumn(arg, tables);
        if ((operation === 'SUM' || operation === 'AVG') && typeof DATABASE[source.table][0][source.field] !== 'number') {
          fail(`${operation} requires a numeric column; ${arg} contains text.`);
        }
        selections.push({ kind: 'aggregate', operation, source, label: aggregate[3] || `${operation}(${arg})` });
      } else if (part === '*') {
        for (const table of tables) {
          for (const field of availableColumns(table)) {
            selections.push({ kind: 'column', table, field, label: joined ? `${table}.${field}` : field });
          }
        }
      } else if (/^(customers|orders)\.\*$/i.test(part)) {
        const table = part.split('.')[0].toLowerCase();
        if (!tables.includes(table)) fail(`The table "${table}" is not part of this query.`);
        for (const field of availableColumns(table)) selections.push({ kind: 'column', table, field, label: `${table}.${field}` });
      } else {
        const colMatch = part.match(/^([a-z_][\w.]*)(?:\s+AS\s+([a-z_][\w]*))?$/i);
        if (!colMatch) fail(`Unsupported SELECT item: ${part}. Use column names, *, COUNT(), SUM() or AVG().`);
        const source = resolveColumn(colMatch[1], tables);
        selections.push({ kind: 'column', ...source, label: colMatch[2] || colMatch[1] });
      }
    }
    if (selections.length > 30) fail('Select 30 columns or fewer in this lab.');

    const grouping = parsed[7] ? resolveColumn(parsed[7], tables) : null;
    const hasAggregate = selections.some(item => item.kind === 'aggregate');
    const aggregateMode = Boolean(grouping || hasAggregate);
    if (parsed[8] && !aggregateMode) fail('HAVING requires GROUP BY or an aggregate SELECT expression.');
    if (aggregateMode) {
      for (const item of selections) {
        if (item.kind !== 'column') continue;
        if (!grouping || item.table !== grouping.table || item.field !== grouping.field) {
          fail(`Column "${item.label}" must appear in GROUP BY or inside COUNT(), SUM() or AVG().`);
        }
      }
      const groups = new Map();
      if (grouping) {
        for (const row of rows) {
          const value = valueFor(row, grouping);
          const key = JSON.stringify([typeof value, value]);
          if (!groups.has(key)) groups.set(key, { value, members: [] });
          groups.get(key).members.push(row);
        }
      } else {
        // SQL returns one aggregate row even if WHERE matches no records.
        groups.set('all', { value: undefined, members: rows });
      }
      const having = parsed[8] ? parseHavingComparison(parsed[8], tables, selections) : null;
      let summaryRows = [...groups.values()]
        .filter(group => !having || having(group))
        .map(group => ({
          values: selections.map(item => item.kind === 'column' ? group.value : aggregateValue(item, group.members)),
          groupValue: group.value
        }));
      if (parsed[9]) {
        const orderKey = parsed[9].toLowerCase();
        const selectionIndex = selections.findIndex(item => item.label.toLowerCase() === orderKey);
        let useGroupValue = false;
        if (selectionIndex === -1 && grouping) {
          const sort = resolveColumn(parsed[9], tables);
          useGroupValue = sort.table === grouping.table && sort.field === grouping.field;
        }
        if (selectionIndex === -1 && !useGroupValue) {
          fail(`ORDER BY "${parsed[9]}" must use a selected column/alias or the GROUP BY column.`);
        }
        const descending = parsed[10]?.toUpperCase() === 'DESC';
        summaryRows.sort((a, b) => compareSqlValues(
          useGroupValue ? a.groupValue : a.values[selectionIndex],
          useGroupValue ? b.groupValue : b.values[selectionIndex],
          descending
        ));
      }
      if (parsed[11] !== undefined) summaryRows = summaryRows.slice(0, checkedSqlLimit(parsed[11]));
      return { columns: selections.map(item => item.label), rows: summaryRows.map(item => item.values) };
    }

    // Ordinary (non-aggregate) SELECT behavior stays compatible with Stage 1–5 Part 1.
    if (parsed[9]) {
      const sort = resolveColumn(parsed[9], tables);
      const descending = parsed[10]?.toUpperCase() === 'DESC';
      rows.sort((a, b) => compareSqlValues(valueFor(a, sort), valueFor(b, sort), descending));
    }
    if (parsed[11] !== undefined) rows = rows.slice(0, checkedSqlLimit(parsed[11]));
    return {
      columns: selections.map(item => item.label),
      rows: rows.map(row => selections.map(item => valueFor(row, item)))
    };
  }

  function checkedSqlLimit(raw) {
    const limit = Number(raw);
    if (!Number.isSafeInteger(limit) || limit > 1000) fail('LIMIT must be between 0 and 1000.');
    return limit;
  }

  function compareSqlValues(first, second, descending) {
    let comparison;
    if (first == null && second == null) comparison = 0;
    else if (first == null) comparison = 1;
    else if (second == null) comparison = -1;
    else if (typeof first === 'number' && typeof second === 'number') comparison = first - second;
    else comparison = String(first).localeCompare(String(second));
    return descending ? -comparison : comparison;
  }

  function appendCell(row, tag, value) {
    const cell = document.createElement(tag);
    if (value === null || value === undefined) {
      cell.textContent = 'NULL';
      cell.classList.add('null-value');
    } else {
      cell.textContent = String(value);
    }
    row.appendChild(cell);
  }

  function renderTable(head, body, columns, records) {
    head.replaceChildren(); body.replaceChildren();
    const headerRow = document.createElement('tr');
    for (const column of columns) appendCell(headerRow, 'th', column);
    head.appendChild(headerRow);
    if (records.length === 0) {
      const emptyRow = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = Math.max(columns.length, 1);
      cell.textContent = 'No rows matched this query.';
      emptyRow.appendChild(cell);
      body.appendChild(emptyRow);
    } else {
      for (const record of records) {
        const row = document.createElement('tr');
        for (const value of record) appendCell(row, 'td', value);
        body.appendChild(row);
      }
    }
  }

  // Stage 3: indicative, keyword-based review. Uses report fields as they were saved in Stage 2.
  const REVIEW_CRITERIA = [
    { caseId: 'totals', label: 'Check order totals', criteria: [
      { points: 6, description: 'Provides a SQL query examining order totals', check: r => /\bfrom\s+orders\b/i.test(r.query) && /total|order\s+by/i.test(r.query) },
      { points: 8, description: 'States the requirement that totals cannot be negative', check: r => /(?:negative|non.?negative|zero|>=\s*0|greater than|less than 0|below 0)/i.test(r.expected) },
      { points: 16, description: 'Identifies order 5010 and the invalid total -350', check: r => /\b5010\b/.test(r.actual + ' ' + r.title) && /-\s*350\b/.test(r.actual + ' ' + r.title) }
    ]},
    { caseId: 'ownership', label: 'Check order ownership', criteria: [
      { points: 6, description: 'Includes a query checking order ownership or customer IDs', check: r => /\bfrom\s+(orders|customers)\b/i.test(r.query) && /(customer_id|\bid\b)/i.test(r.query) },
      { points: 8, description: 'States that every order must reference a real customer', check: r => /(?:customer|exist|valid|referenc|match|orphan|foreign.key)/i.test(r.expected) },
      { points: 16, description: 'Identifies order 5009 with nonexistent customer 999', check: r => /\b5009\b/.test(r.actual + ' ' + r.title) && /\b999\b/.test(r.actual + ' ' + r.title) }
    ]},
    { caseId: 'emails', label: 'Check customer emails', criteria: [
      { points: 6, description: 'Uses a SQL query examining customer emails', check: r => /\bfrom\s+customers\b/i.test(r.query) && /email/i.test(r.query) },
      { points: 8, description: 'Explains the email uniqueness requirement', check: r => /(?:unique|duplicate|same email|share|one account|distinct)/i.test(r.expected) },
      { points: 16, description: 'Identifies both customer IDs and the duplicated email', check: r => /\b101\b/.test(r.actual + ' ' + r.title) && /\b107\b/.test(r.actual + ' ' + r.title) && /jane@example\.com/i.test(r.actual + ' ' + r.title) }
    ]}
  ];

  function assessSqlReports(reports) {
    const breakdown = REVIEW_CRITERIA.map(definition => {
      const candidates = reports.filter(r => r.caseId === definition.caseId);
      const assessments = candidates.map(report => ({
        report,
        checks: definition.criteria.map(criteria => ({
          points: criteria.points, description: criteria.description, passed: Boolean(criteria.check(report))
        }))
      }));
      assessments.forEach(a => { a.points = a.checks.reduce((sum, item) => sum + (item.passed ? item.points : 0), 0); });
      assessments.sort((a,b) => b.points-a.points);
      const best = assessments[0];
      return { label: definition.label, caseId: definition.caseId, reportId: best?.report.id || null,
        points: best?.points || 0, checks: best?.checks || definition.criteria.map(c => ({points:c.points, description:c.description, passed:false})) };
    });
    const evidence = breakdown.reduce((sum, item) => sum + item.points, 0);
    const complete = breakdown.filter(item => item.reportId).length;
    const documented = breakdown.filter(item => reports.some(r => r.id === item.reportId && r.query.trim().length >= 12 && r.expected.trim().length >= 12 && r.actual.trim().length >= 12)).length;
    const documentation = documented * 2 + (complete === 3 ? 4 : 0);
    return { breakdown, evidence, documentation, total: Math.min(100, evidence + documentation), complete };
  }

  // A stable ID represents the exact set of saved reports. Clicking Finish again
  // with unchanged reports does not add another history entry. Editing saved
  // evidence produces a distinct ID and therefore a new review attempt.
  function sqlReviewSessionId(reports) {
    const snapshot = JSON.stringify([...reports].sort((a, b) => a.id.localeCompare(b.id)));
    let hashA = 2166136261;
    let hashB = 5381;
    for (let i = 0; i < snapshot.length; i++) {
      const code = snapshot.charCodeAt(i);
      hashA = Math.imul(hashA ^ code, 16777619) >>> 0;
      hashB = (Math.imul(hashB, 33) ^ code) >>> 0;
    }
    return 'sql-validation-' + hashA.toString(16).padStart(8, '0') + '-' + hashB.toString(16).padStart(8, '0');
  }

  function saveSqlReviewToProgress(reports, result) {
    if (result.complete !== 3) {
      return 'Your feedback is available. Document all three cases before saving this challenge to My Progress.';
    }
    try {
      const raw = localStorage.getItem(HOME_PROGRESS_STORAGE_KEY);
      const history = raw === null ? [] : JSON.parse(raw);
      // Never overwrite a malformed or unexpected progress store.
      if (!Array.isArray(history)) {
        return 'My Progress has an unexpected storage format. No existing progress was changed.';
      }
      const id = sqlReviewSessionId(reports);
      if (history.some(item => item && item.id === id)) {
        return 'This unchanged SQL review is already saved in My Progress. No duplicate was added.';
      }
      const session = {
        id,
        type: 'challenge',
        area: HOME_PROGRESS_AREA,
        score: result.total,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        questionScores: [...result.breakdown.map(item => item.points), result.documentation]
      };
      // Read and prepend without modifying or dropping existing history fields.
      localStorage.setItem(HOME_PROGRESS_STORAGE_KEY,
        JSON.stringify([session, ...history].slice(0, HOME_PROGRESS_HISTORY_LIMIT)));
      return '✓ SQL review score saved to My Progress. Return to the homepage to see it.';
    } catch (_) {
      return 'Review feedback is available, but My Progress could not be saved. Check browser storage permissions.';
    }
  }

  function initializeSqlReview(getReports) {
    const section = document.getElementById('sqlReviewResult');
    const status = document.getElementById('sqlReviewStatus');
    const guide = document.getElementById('sqlAnswerGuide');
    const coverage = document.getElementById('sqlReviewCoverage');
    const cards = document.getElementById('sqlReviewCards');
    const score = document.getElementById('sqlReviewScore');
    const breakdown = document.getElementById('sqlReviewBreakdown');
    const meter = document.getElementById('sqlReviewMeterFill');

    function markDirty() {
      section.hidden = true;
      guide.hidden = true;
      guide.open = false;
      status.textContent = 'Reports changed. Finish the challenge again for updated feedback.';
      const seen = new Set(getReports().map(r=>r.caseId));
      coverage.textContent = `${seen.size} of 3 cases documented`;
    }

    function updateCoverage() {
      const seen = new Set(getReports().map(r=>r.caseId));
      coverage.textContent = `${seen.size} of 3 cases documented`;
    }
    document.getElementById('finishSqlChallenge').addEventListener('click', () => {
      const result = assessSqlReports(getReports());
      cards.replaceChildren();
      for (const item of result.breakdown) {
        const card = document.createElement('article');
        card.className = 'review-case';
        const heading = document.createElement('h4');
        heading.textContent = `${item.label} — ${item.points}/30 evidence points`;
        card.append(heading);
        const text = document.createElement('p');
        text.textContent = item.reportId ? `Best matching report: ${item.reportId}` : 'No report saved for this case yet.';
        card.append(text);
        const list = document.createElement('ul');
        for (const check of item.checks) {
          const li = document.createElement('li');
          li.className = check.passed ? 'found' : 'missed';
          li.textContent = `${check.passed ? '✓' : '○'} ${check.description} (${check.points} pts)`;
          list.append(li);
        }
        card.append(list); cards.append(card);
      }
      score.textContent = `${result.total}/100`;
      breakdown.textContent = `${result.complete}/3 cases documented · ${result.evidence}/90 evidence points · ${result.documentation}/10 documentation points.`;
      meter.style.width = `${result.total}%`;
      section.hidden = false;
      guide.hidden = false;
      status.textContent = 'Review complete. ' + saveSqlReviewToProgress(getReports(), result) + ' Open the answer guide below, or edit reports and finish again.';
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    updateCoverage();
    return { updateCoverage, markDirty };
  }

  // Bug report drafts are stored separately; only completed review scores update My Progress.
  function initializeReports(query) {
    const form = document.getElementById('sqlReportForm');
    const status = document.getElementById('sqlReportStatus');
    const count = document.getElementById('sqlReportCount');
    const empty = document.getElementById('sqlReportsEmpty');
    const list = document.getElementById('sqlReportsList');
    const inputIds = ['sqlReportCase', 'sqlReportTitle', 'sqlReportQuery', 'sqlReportExpected', 'sqlReportActual'];
    let editId = null;
    let reports = [];
    let nextNumber = 1;
    let review = null;
    try {
      const saved = JSON.parse(localStorage.getItem(REPORTS_KEY) || 'null');
      if (saved && saved.version === 1 && Array.isArray(saved.reports)) {
        reports = saved.reports.filter(item => item && typeof item === 'object' && typeof item.id === 'string'
          && Object.hasOwn(CASE_LABELS, item.caseId) && typeof item.title === 'string'
          && typeof item.query === 'string' && typeof item.expected === 'string' && typeof item.actual === 'string');
        nextNumber = Math.max(1, Number.isSafeInteger(saved.nextNumber) ? saved.nextNumber : 1,
          ...reports.map(item => Number(item.id.match(/^SQL-(\d+)$/)?.[1] || 0) + 1));
      }
    } catch (error) {
      status.textContent = 'Saved reports could not be read. Existing browser data has not been overwritten.';
    }

    function persist() {
      try {
        localStorage.setItem(REPORTS_KEY, JSON.stringify({ version: 1, nextNumber, reports }));
        return true;
      } catch (error) {
        status.textContent = 'Browser storage is unavailable. The change may not survive a refresh.';
        return false;
      }
    }

    function resetForm() {
      form.reset();
      editId = null;
      document.getElementById('saveSqlReport').textContent = 'Save bug report';
    }

    function addReportText(parent, label, value, asCode = false) {
      if (asCode) {
        const heading = document.createElement('strong');
        heading.textContent = label;
        parent.appendChild(heading);
        const pre = document.createElement('pre');
        pre.textContent = value;
        parent.appendChild(pre);
      } else {
        const p = document.createElement('p');
        const heading = document.createElement('strong');
        heading.textContent = `${label} `;
        p.appendChild(heading);
        p.appendChild(document.createTextNode(value));
        parent.appendChild(p);
      }
    }
    function render() {
      list.replaceChildren();
      count.textContent = String(reports.length);
      empty.hidden = reports.length > 0;
      for (const report of reports) {
        const card = document.createElement('article');
        card.className = 'report-card';
        const label = document.createElement('p');
        label.className = 'case-kicker';
        label.textContent = `${report.id} · ${CASE_LABELS[report.caseId]}`;
        card.appendChild(label);
        const title = document.createElement('h4');
        title.textContent = report.title;
        card.appendChild(title);
        addReportText(card, 'Evidence query:', report.query, true);
        addReportText(card, 'Expected:', report.expected);
        addReportText(card, 'Actual:', report.actual);
        const actions = document.createElement('div');
        actions.className = 'report-card-actions';
        const edit = document.createElement('button');
        edit.type = 'button'; edit.textContent = 'Edit';
        edit.setAttribute('aria-label', `Edit ${report.id}`);
        edit.addEventListener('click', () => {
          const values = [report.caseId, report.title, report.query, report.expected, report.actual];
          inputIds.forEach((id, index) => { document.getElementById(id).value = values[index]; });
          editId = report.id;
          document.getElementById('saveSqlReport').textContent = 'Update bug report';
          status.textContent = `Editing ${report.id}.`;
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        const remove = document.createElement('button');
        remove.type = 'button'; remove.textContent = 'Delete';
        remove.setAttribute('aria-label', `Delete ${report.id}`);
        remove.addEventListener('click', () => {
          if (!window.confirm(`Delete ${report.id}? This cannot be undone.`)) return;
          reports = reports.filter(item => item.id !== report.id);
          if (editId === report.id) resetForm();
          persist(); render();
          review.markDirty();
          status.textContent = `${report.id} deleted.`;
        });
        actions.append(edit, remove);
        card.appendChild(actions);
        list.appendChild(card);
      }
    }
    document.getElementById('clearSqlReport').addEventListener('click', () => {
      resetForm();
      status.textContent = 'Report form cleared. Saved reports are unchanged.';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const [caseId, title, evidenceQuery, expected, actual] = inputIds.map(id => document.getElementById(id).value.trim());
      if (!Object.hasOwn(CASE_LABELS, caseId) || !title || !evidenceQuery || !expected || !actual) {
        status.textContent = 'Complete all report fields before saving.';
        return;
      }
      const wasEditing = Boolean(editId);
      const id = editId || `SQL-${String(nextNumber++).padStart(3, '0')}`;
      const report = { id, caseId, title, query: evidenceQuery, expected, actual };
      const index = reports.findIndex(item => item.id === id);
      if (index >= 0) reports[index] = report;
      else reports.push(report);
      const stored = persist();
      render(); resetForm();
      review.markDirty();
      if (stored) status.textContent = `${id} ${wasEditing ? 'updated' : 'saved'} successfully.`;
    });
    render();
    review = initializeSqlReview(() => reports);
  }

  function initialize() {
    const query = document.getElementById('sqlQuery');
    const error = document.getElementById('queryError');
    const badge = document.getElementById('resultBadge');
    const count = document.getElementById('resultCount');
    const timing = document.getElementById('resultTiming');
    const results = document.getElementById('resultTable');
    const empty = document.getElementById('resultEmpty');
    const announcement = document.getElementById('resultAnnouncement');

    let currentTable = 'customers';

    function setDataset(name) {
      DATABASE = name === 'investigation' ? INVESTIGATION_DATABASE : PRACTICE_DATABASE;
      const investigation = name === 'investigation';
      document.querySelectorAll('[data-dataset]').forEach(button => {
        const active = button.dataset.dataset === name;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      document.getElementById('datasetStatus').textContent = investigation
        ? 'Investigation data selected · 7 customers · 10 orders. Three records need your attention.'
        : 'Practice data selected · 6 customers · 8 orders.';
      document.getElementById('investigationSection').hidden = !investigation;
      showPreview(currentTable);
      execute();
    }

    function execute() {
      error.hidden = true;
      try {
        const started = performance.now();
        const outcome = runSelect(query.value);
        const duration = Math.max(0, performance.now() - started);
        renderTable(document.getElementById('resultHead'), document.getElementById('resultBody'), outcome.columns, outcome.rows);
        results.hidden = false;
        empty.hidden = true;
        badge.textContent = 'SUCCESS';
        badge.classList.remove('error');
        count.textContent = `${outcome.rows.length} row${outcome.rows.length === 1 ? '' : 's'} returned`;
        timing.textContent = `Processed locally · ${duration.toFixed(1)} ms`;
        announcement.textContent = `${count.textContent}. Query completed.`;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'The query could not be processed.';
        error.textContent = message;
        error.hidden = false;
        badge.textContent = 'QUERY ERROR';
        badge.classList.add('error');
        count.textContent = 'Query unsuccessful';
        timing.textContent = 'No changes made';
        results.hidden = true;
        empty.hidden = false;
        announcement.textContent = `Query error: ${message}`;
      }
    }

    document.getElementById('runQuery').addEventListener('click', execute);
    document.getElementById('clearQuery').addEventListener('click', () => {
      query.value = '';
      query.focus();
      document.querySelectorAll('[data-example]').forEach(button => button.setAttribute('aria-pressed', 'false'));
      error.hidden = true;
    });
    query.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        execute();
      }
    });
    addStage5LearningExamples();
    document.querySelectorAll('[data-example]').forEach(button => {
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        query.value = EXAMPLES[button.dataset.example];
        error.hidden = true;
        document.querySelectorAll('[data-example]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        query.focus();
      });
    });

    function showPreview(table) {
      currentTable = table;
      const data = DATABASE[table];
      const columns = availableColumns(table);
      document.getElementById('schemaName').textContent = table;
      document.getElementById('schemaDescription').textContent = ` Fictional ${table} · ${data.length} rows`;
      document.getElementById('schemaFields').textContent = `Columns: ${columns.join(' · ')}`;
      renderTable(document.getElementById('previewHead'), document.getElementById('previewBody'), columns, data.map(item => columns.map(field => item[field])));
      document.querySelectorAll('[data-table]').forEach(button => {
        const active = button.dataset.table === table;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    document.querySelectorAll('[data-table]').forEach(button => {
      button.addEventListener('click', () => showPreview(button.dataset.table));
    });
    document.querySelectorAll('[data-dataset]').forEach(button => {
      button.addEventListener('click', () => setDataset(button.dataset.dataset));
    });
    document.querySelectorAll('[data-hint]').forEach(button => {
      button.addEventListener('click', () => {
        query.value = HINT_QUERIES[button.dataset.hint];
        execute();
        document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    initializeReports(query);
    showPreview('customers');
    execute();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
  }
  // Exposed solely for deterministic local verification; does not affect the page UI.
  if (typeof window !== 'undefined') window.PracticalQASqlStage1 = { execute: runSelect };
})();
