## Different types of YAML syntax

YAML supports different types of syntax. The following piece of code

```yaml
condition: { equals: [1, 1] }
```

can also be written as

```yaml
condition:
  equals:
    - 1
    - 1
```

### Best Practices

There are several scenarios where one syntax format is better than the other. For example, if you
have a very big statement, you shouldn’t write everything on one line as it hinders code
readability. Similarly, in smaller statements, unnecessary indentations will decrease readability
and add complexity.

Here’s a good example of that. The following code

```yaml
name: John Doe
job: Developer
foods:
  - Apple
  - Mango
  - Strawberry
  - Lentils
  - Meat
skills:
  - Python
  - Linux
  - Go
  - Javascript
  - Docker
```

can be written better as

```yaml
name: John Doe
job: Developer
foods: ['Apple', 'Mango', 'Strawberry', 'Lentils', 'Meat']
skills: ['Python', 'Linux', 'Go', 'Javascript', 'Docker']
```
