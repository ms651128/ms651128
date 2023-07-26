document.addEventListener('DOMContentLoaded', function () {
  const scrollLinks = document.querySelectorAll('.scroll-link');

  function scrollToSection(event) {
    event.preventDefault();
    const target = document.querySelector(event.target.getAttribute('data-target'));
    const offsetTop = target.getBoundingClientRect().top;
    const navbarHeight = document.getElementById('navbar').offsetHeight;
    const totalOffset = offsetTop + window.scrollY;

    window.scrollTo({
      top: totalOffset,
      behavior: 'smooth'
    });
  }

  scrollLinks.forEach(link => {
    link.addEventListener('click', scrollToSection);
  });
});


document.addEventListener('DOMContentLoaded', function () {
  const navbarHidden = document.getElementById('navbar-hidden');
  const scrollLinks = document.querySelectorAll('.scroll-link');
  const sectionPositions = {};

  function updateSectionPositions() {
    // Calculate the top offset of each section
    scrollLinks.forEach(link => {
      const target = document.querySelector(link.getAttribute('data-target'));
      sectionPositions[link.getAttribute('data-target')] = target.offsetTop;
    });
  }

  function toggleNavbar() {
    // Toggle the visibility of the second navbar based on the scroll position
    const scrollY = window.scrollY;
    const firstSectionOffset = sectionPositions['#services'];

    if (scrollY >= firstSectionOffset) {
      navbarHidden.classList.remove('navbar-hidden');
    } else {
      navbarHidden.classList.add('navbar-hidden');
    }
  }

  updateSectionPositions(); // Initial calculation of section positions
  window.addEventListener('scroll', toggleNavbar);
  window.addEventListener('resize', updateSectionPositions);
});

//document.addEventListener("DOMContentLoaded", function () {

const overlay = document.getElementById('overlay');
const overlayImage = document.getElementById('overlayImage');
const imageLinks = document.querySelectorAll('.image-link');
let currentIndex = 0;

function showOverlay(index) {
  const imageUrl = imageLinks[index].getAttribute('data-image-url');
  overlayImage.src = imageUrl;
  currentIndex = index;
  overlay.style.display = 'flex';
}


function hideOverlay() {
  overlay.style.display = 'none';
}

async function deleteImage() {

  const imageUrl = document.getElementById('overlayImage').src;
  let imageHandle = imageUrl.split('/').pop(); // Extract the image handle from the URL
  try {
    const response = await fetch(`/delete/${encodeURIComponent(imageHandle)}`, {
      method: "DELETE",
    });
    if (response.ok) {
      location.reload();
    } else {
      console.error("Error deleting image:", response.statusText);
    }
  } catch (error) {
    console.error("Error deleting image:", error);
  }
}



const deleteButton = document.getElementById("deleteButton");
deleteButton.addEventListener("click", function () {
  deleteImage();
});

const closeButton = document.getElementById("closeButton");
closeButton.addEventListener("click", function () {
  hideOverlay();
});



// Function to handle forward and backward navigation
function changeImage(step) {
  currentIndex += step;

  // Loop back to the first image if at the end
  if (currentIndex < 0) {
    currentIndex = imageLinks.length - 1;
  } else if (currentIndex >= imageLinks.length) {
    currentIndex = 0;
  }

  showOverlay(currentIndex);
}


// ... Your existing event listeners ...

// Show the first image in overlay on page load




// Add click event listener to each image link
imageLinks.forEach(imageLink => {
  imageLink.addEventListener('click', function (event) {
    event.preventDefault();

    const imageUrl = this.getAttribute('data-image-url');

    // Set the image source for the overlay
    overlayImage.src = imageUrl;

    // Show the overlay
    overlay.style.display = 'flex';
  });
});


document.addEventListener("DOMContentLoaded", function () {
  const uploadElements = document.querySelectorAll(".upload");
  uploadElements.forEach(uploadElement => {
    uploadElement.addEventListener("click", function (event) {
      event.preventDefault();
      const fileInput = document.getElementById("fileInput");
      fileInput.click();
    });
  });

  document.getElementById("fileInput").addEventListener("change", function () {
    const apikey = "A8olZHEwhSBSPApIUMQxIz";
    const client = filestack.init(apikey);
    const file = this.files[0];
    if (file) {
      client.upload(file).then(result => {
        const fileUrl = result.url;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              location.reload();
            } else {
              console.error("Error uploading file:", xhr.statusText);
            }
          }
        };
        xhr.send(JSON.stringify({ fileUrl }));
      }).catch(error => {
        console.error('Error uploading file:', error);
      });
    }
  });

});


