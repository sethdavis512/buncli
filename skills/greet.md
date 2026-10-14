# buncli greet

Greets someone by name. It's an example command: copy its shape when you add real ones.

## Usage

```bash
buncli greet Ada --json
```

```json
{"name":"Ada","greeting":"Hello, Ada!"}
```

## Inputs

| Input | How to pass it | Required |
| --- | --- | --- |
| name | first argument | yes, unless a person is at a terminal to answer the prompt |

## Errors

| Code | Exit | Cause | Fix |
| --- | --- | --- | --- |
| `missing_input` | 2 | No name was passed and prompting is off. | Pass the name as the first argument. |
