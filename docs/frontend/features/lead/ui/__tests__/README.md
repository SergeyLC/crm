# LeadEditDialog Tests

This file contains instructions for running and working with tests for the `LeadEditDialog` component.

# LeadEditDialog Tests

This file contains instructions for running and working with tests for the `LeadEditDialog` component.

## Test Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── setupTests.ts          # Jest setup
│   │   └── test-utils.tsx         # Test utilities
│   └── features/lead/ui/__tests__/
│       └── LeadEditDialog.test.tsx # Unit tests
├── cypress/
│   ├── e2e/
│   │   └── lead-edit-dialog.cy.ts  # E2E tests
│   ├── fixtures/
│   │   └── lead.json               # Test data
│   └── support/
│       └── commands.ts             # Cypress commands
└── jest.config.cjs                 # Jest configuration
```

## Unit Tests (Jest + React Testing Library)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only LeadEditDialog tests
npm run test:lead-dialog

# Run tests with code coverage
npm run test:coverage

# Verbose test output
npm run test:ui
```

### What is tested

#### Creating Lead
- ✅ Proper display of create dialog
- ✅ Form filling and data submission
- ✅ Create error handling
- ✅ Form initialization with default values

#### Updating Lead
- ✅ Proper display of edit dialog
- ✅ Loading existing data
- ✅ Loading state
- ✅ Data updates and submission
- ✅ Data type conversion (string → number)
- ✅ Update error handling

#### Dialog behavior
- ✅ Opening/closing dialog
- ✅ Operation cancellation
- ✅ Button blocking during submission
- ✅ Loading states

#### Form interactions
- ✅ Field change handling
- ✅ Appointments sanitization
- ✅ Data validation

#### Accessibility
- ✅ ARIA attributes
- ✅ Keyboard navigation
- ✅ Semantic markup

## E2E Tests (Cypress)

### Running Tests

```bash
# Open Cypress in interactive mode
npm run cypress:open

# Run E2E tests in headless mode
npm run cypress:run

# Run only LeadEditDialog tests
npm run test:e2e

# Open E2E tests in browser
npm run test:e2e:open
```

### What is tested

#### Complete Lead creation workflow
- ✅ Opening create dialog
- ✅ Filling all form fields
- ✅ Submission and result verification
- ✅ Success notifications display

#### Complete Lead editing workflow
- ✅ Opening edit dialog
- ✅ Form pre-population with data
- ✅ Data modification
- ✅ Saving changes

#### Validation and errors
- ✅ Required fields validation
- ✅ Server error handling
- ✅ Network error handling
- ✅ Validation error display

#### UI interactions
- ✅ Field navigation
- ✅ Appointments management
- ✅ Autocomplete and selectors
- ✅ Form data persistence

#### Accessibility
- ✅ Keyboard navigation
- ✅ ARIA attributes and roles
- ✅ Focus and tabulation

#### Loading states
- ✅ Loading indicators
- ✅ UI blocking during operations
- ✅ Timeouts and long operations

## Mocks and Fixtures

### Jest mocks
- `@/entities/lead` - Lead API hooks
- `@/shared/lib/auth` - Authentication
- `@/features/form/ui/BaseUpsertFields` - Form component
- `@/entities/appointment/lib/sanitizers` - Appointments sanitization

### Cypress fixtures
- `cypress/fixtures/lead.json` - Lead test data

### Cypress commands
- `cy.login()` - User authentication
- `cy.createTestLead(data)` - Create test Lead
- `cy.tab()` - Navigate to next element

## Test Debugging

### Jest
```bash
# Run specific test
npm test -- --testNamePattern="should create lead successfully"

# Debug with verbose output
npm test -- --verbose

# Run with watch and coverage
npm run test:watch -- --coverage
```

### Cypress
```bash
# Open specific test in browser
npx cypress open --spec cypress/e2e/lead-edit-dialog.cy.ts

# Run with video recording
npx cypress run --record --key YOUR_KEY

# Debug with browser
npx cypress run --headed --no-exit
```

## Code Coverage

Tests are configured to collect code coverage metrics:

```bash
npm run test:coverage
```

Reports are saved in the `coverage/` folder and include:
- HTML report (`coverage/lcov-report/index.html`)
- LCOV file for CI/CD
- Text output in console

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Unit tests
      - run: npm ci
      - run: npm run test:coverage
      
      # E2E tests
      - run: npm run build
      - run: npm start &
      - run: npm run test:e2e
```

## Requirements

### Jest Dependencies
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jest-environment-jsdom`

### Cypress Dependencies
- `cypress`
- `@cypress/webpack-preprocessor`

All necessary dependencies are already included in `package.json`.

## Useful Commands

```bash
# Clear Jest cache
npx jest --clearCache

# Update snapshots
npm test -- --updateSnapshot

# Run tests for specific file
npm test LeadEditDialog.test.tsx

# Cypress with specific browser
npx cypress run --browser chrome

# View list of available tests
npm test -- --listTests
```

## Unit тесты (Jest + React Testing Library)

### Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить тесты в watch режиме
npm run test:watch

# Запустить только тесты LeadEditDialog
npm run test:lead-dialog

# Запустить тесты с покрытием кода
npm run test:coverage

# Подробный вывод тестов
npm run test:ui
```

### Что тестируется

#### Создание Lead
- ✅ Правильное отображение диалога создания
- ✅ Заполнение формы и отправка данных
- ✅ Обработка ошибок создания
- ✅ Инициализация формы с дефолтными значениями

#### Обновление Lead
- ✅ Правильное отображение диалога редактирования
- ✅ Загрузка существующих данных
- ✅ Состояние загрузки
- ✅ Обновление данных и отправка
- ✅ Конвертация типов данных (string → number)
- ✅ Обработка ошибок обновления

#### Поведение диалога
- ✅ Открытие/закрытие диалога
- ✅ Отмена операции
- ✅ Блокировка кнопок во время отправки
- ✅ Состояния загрузки

#### Взаимодействие с формой
- ✅ Обработка изменений полей
- ✅ Санитизация appointments
- ✅ Валидация данных

#### Доступность (Accessibility)
- ✅ ARIA атрибуты
- ✅ Клавиатурная навигация
- ✅ Семантическая разметка

## E2E тесты (Cypress)

### Запуск тестов

```bash
# Открыть Cypress в интерактивном режиме
npm run cypress:open

# Запустить E2E тесты в headless режиме
npm run cypress:run

# Запустить только тесты LeadEditDialog
npm run test:e2e

# Открыть E2E тесты в браузере
npm run test:e2e:open
```

### Что тестируется

#### Полный workflow создания Lead
- ✅ Открытие диалога создания
- ✅ Заполнение всех полей формы
- ✅ Отправка и проверка результата
- ✅ Отображение уведомлений об успехе

#### Полный workflow редактирования Lead
- ✅ Открытие диалога редактирования
- ✅ Предзаполнение формы данными
- ✅ Изменение данных
- ✅ Сохранение изменений

#### Валидация и ошибки
- ✅ Проверка обязательных полей
- ✅ Обработка ошибок сервера
- ✅ Обработка сетевых ошибок
- ✅ Отображение ошибок валидации

#### Взаимодействие с UI
- ✅ Навигация по полям
- ✅ Работа с appointments
- ✅ Автокомплит и селекторы
- ✅ Сохранение данных формы

#### Доступность
- ✅ Клавиатурная навигация
- ✅ ARIA атрибуты и роли
- ✅ Фокус и табуляция

#### Состояния загрузки
- ✅ Индикаторы загрузки
- ✅ Блокировка UI во время операций
- ✅ Таймауты и долгие операции

## Моки и фикстуры

### Jest моки
- `@/entities/lead` - API хуки для Lead
- `@/shared/lib/auth` - Аутентификация
- `@/features/form/ui/BaseUpsertFields` - Компонент формы
- `@/entities/appointment/lib/sanitizers` - Санитизация appointments

### Cypress фикстуры
- `cypress/fixtures/lead.json` - Тестовые данные Lead

### Cypress команды
- `cy.login()` - Авторизация пользователя
- `cy.createTestLead(data)` - Создание тестового Lead
- `cy.tab()` - Переход к следующему элементу

## Отладка тестов

### Jest
```bash
# Запуск конкретного теста
npm test -- --testNamePattern="should create lead successfully"

# Отладка с verbose выводом
npm test -- --verbose

# Запуск с watch и coverage
npm run test:watch -- --coverage
```

### Cypress
```bash
# Открыть конкретный тест в браузере
npx cypress open --spec cypress/e2e/lead-edit-dialog.cy.ts

# Запуск с записью видео
npx cypress run --record --key YOUR_KEY

# Отладка с браузером
npx cypress run --headed --no-exit
```

## Покрытие кода

Тесты настроены для сбора метрик покрытия кода:

```bash
npm run test:coverage
```

Отчеты сохраняются в папке `coverage/` и включают:
- HTML отчет (`coverage/lcov-report/index.html`)
- LCOV файл для CI/CD
- Текстовый вывод в консоль

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Unit тесты
      - run: npm ci
      - run: npm run test:coverage
      
      # E2E тесты
      - run: npm run build
      - run: npm start &
      - run: npm run test:e2e
```

## Требования

### Зависимости для Jest
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jest-environment-jsdom`

### Зависимости для Cypress
- `cypress`
- `@cypress/webpack-preprocessor`

Все необходимые зависимости уже включены в `package.json`.

## Полезные команды

```bash
# Очистить кеш Jest
npx jest --clearCache

# Обновить снапшоты
npm test -- --updateSnapshot

# Запуск тестов для конкретного файла
npm test LeadEditDialog.test.tsx

# Cypress с определенным браузером
npx cypress run --browser chrome

# Посмотреть список доступных тестов
npm test -- --listTests
```