# api-to-chart-js

A clean, vanilla HTML/CSS/JS web application that demonstrates two core utilities: 
1. **Dynamic Math Operations:** A flexible function that accepts a variable number of arguments and calculates their product.
2. **Data Visualization:** An asynchronous API fetcher that retrieves user data from JSONPlaceholder, transforms it, and plots an interactive bar chart using [TensorFlow.js Visor](https://js.tensorflow.org/api_vis/latest/).

![App Screenshot](https://via.placeholder.com/800x400.png?text=Replace+with+your+app+screenshot)
*(Note: Replace the image link above with a screenshot of your actual dashboard once deployed!)*

## ✨ Features
* **Variable Argument Multiplication:** Uses ES6 Rest Parameters to handle and multiply an infinite amount of user-inputted numbers.
* **REST API Integration:** Asynchronously fetches dummy user data from a public endpoint (`jsonplaceholder.typicode.com`).
* **Data Transformation:** Maps and extracts relevant JSON data (Usernames and Name Lengths) to fit the specific input requirements of the charting library.
* **TFJS Visor:** Renders a clean, interactive bar chart directly in the DOM without needing heavy dashboard frameworks.
* **Modern UI:** Built with raw CSS variables, flexbox, and a clean component-driven card layout.

## 🛠️ Technologies Used
* HTML5
* CSS3 (Vanilla)
* JavaScript (ES6+)
* [TensorFlow.js Visor](https://github.com/tensorflow/tfjs-vis) (via CDN)
* [JSONPlaceholder API](https://jsonplaceholder.typicode.com/)

## 🚀 Getting Started

Because this project is built with vanilla web technologies, there are no complex build steps or dependencies to install (like npm or Webpack).

### Prerequisites
* A modern web browser.
* *(Optional)* A local server extension like **Live Server** in VS Code if you plan to expand the API fetches and want to avoid CORS issues.

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/giftwarieta/api-to-chart-js.git](https://github.com/giftwarieta/api-to-chart-js.git)