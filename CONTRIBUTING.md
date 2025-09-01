# Contributing to Lelekart

Thank you for your interest in contributing to Lelekart! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear and descriptive title**
- **Detailed description** of the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Screenshots or videos** if applicable
- **Environment information** (OS, React Native version, device)
- **Console logs** or error messages

### Suggesting Enhancements

For feature requests:

- **Clear and descriptive title**
- **Detailed description** of the proposed feature
- **Use case** and **benefits**
- **Mockups or wireframes** if applicable
- **Alternative solutions** considered

### Code Contributions

#### Prerequisites

- Node.js >= 18.0.0
- React Native development environment
- Git
- Code editor (VS Code recommended)

#### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/lelekart_app.git
   cd lelekart_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

#### Coding Standards

##### JavaScript/TypeScript

- Use **TypeScript** for new files
- Follow **ESLint** rules
- Use **Prettier** for code formatting
- Write **descriptive variable and function names**
- Add **JSDoc comments** for complex functions
- Keep functions **small and focused**

##### React Native

- Use **functional components** with hooks
- Follow **React Native best practices**
- Implement **proper error boundaries**
- Use **React Navigation** for routing
- Implement **proper loading states**

##### Styling

- Use **StyleSheet.create()** for styles
- Follow **consistent naming conventions**
- Use **relative units** when possible
- Implement **responsive design**
- Support **dark/light themes**

#### Commit Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(auth): add biometric authentication
fix(cart): resolve item quantity update issue
docs(readme): update installation instructions
style(ui): improve button component styling
```

#### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Run tests and linting**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use the provided PR template
   - Include a clear description
   - Link related issues
   - Add screenshots for UI changes

#### PR Review Process

- **Code review** by maintainers
- **Automated checks** must pass
- **Tests** must be included
- **Documentation** must be updated
- **Screenshots** for UI changes

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=CartTab
```

### Writing Tests

- Use **Jest** and **React Native Testing Library**
- Test **user interactions** and **component behavior**
- Mock **external dependencies**
- Test **error scenarios**
- Aim for **good test coverage**

### Test Structure

```javascript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test implementation
  });

  it('should handle user interactions', () => {
    // Test implementation
  });

  it('should handle errors gracefully', () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Documentation

- **JSDoc comments** for functions and classes
- **Inline comments** for complex logic
- **README updates** for new features
- **API documentation** for endpoints

### User Documentation

- **Setup instructions** for new features
- **Usage examples** and **screenshots**
- **Troubleshooting guides**
- **FAQ updates**

## 🔧 Development Tools

### Recommended Extensions (VS Code)

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **React Native Tools** - React Native support
- **GitLens** - Git integration
- **Auto Rename Tag** - JSX support

### Useful Commands

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Clean and rebuild
npm run clean

# Build for production
npm run build:android
npm run build:ios
```

## 🐛 Debugging

### Common Issues

1. **Metro bundler issues**
   ```bash
   npm start -- --reset-cache
   ```

2. **Android build issues**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build issues**
   ```bash
   cd ios && rm -rf build && cd ..
   ```

4. **Dependency issues**
   ```bash
   rm -rf node_modules && npm install
   ```

### Debug Tools

- **React Native Debugger**
- **Flipper** for debugging
- **Chrome DevTools**
- **Reactotron** for logging

## 📋 Issue Templates

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., iOS 15, Android 12]
- React Native: [e.g., 0.80.1]
- Device: [e.g., iPhone 13, Samsung Galaxy S21]

## Additional Information
Screenshots, logs, etc.
```

### Feature Request Template

```markdown
## Feature Description
Brief description of the feature

## Use Case
Why this feature is needed

## Proposed Solution
How the feature should work

## Alternatives Considered
Other approaches considered

## Additional Information
Mockups, examples, etc.
```

## 🏷️ Labels

We use the following labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `priority: low` - Low priority issues
- `status: in progress` - Work in progress
- `status: blocked` - Blocked by other issues

## 📞 Getting Help

If you need help:

1. **Check existing issues** and **documentation**
2. **Search the codebase** for similar implementations
3. **Ask in discussions** or **create an issue**
4. **Join our community** channels

## 🙏 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page
- **Project documentation**

## 📄 License

By contributing to Lelekart, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Lelekart! 🚀
