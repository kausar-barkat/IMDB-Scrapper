import axios from "axios";
import cheerio from "cheerio";
import * as O from "optics-ts";

const BASE_URL = "https://www.imdb.com";
let url = "/search/title/?groups=top_250&sort=user_rating";

type Movie = {
  rank: string;
  title: string;
  year: string;
  ratings: string;
  metascore: string;
  director: string;
  stars: string[];
  genre: string;
  duration: string;
};

const fetchMovieIndex = (movieName: string, movies: Movie[]) => {
  const index = movies.findIndex((movie) => {
    return movie.title.toLowerCase() === movieName.toLowerCase();
  });
  return index;
};

const getMovieDetails = (
  movieName: string,
  valueToBeFetched: any,
  movies: Movie[]
) => {
  console.log("\n");
  const index = fetchMovieIndex(movieName, movies);
  if (index !== -1) {
    const movieLens = O.optic<Movie>().prop(valueToBeFetched);
    console.log(
      `${valueToBeFetched} for ${movies[index].title} - `,
      O.get(movieLens)(movies[index])
    );
  } else {
    console.log(movieName + " was not found");
  }
};

const getDirectorFromMovie = (movieName: string, movies: Movie[]) => {
  console.log("\n");
  const index = fetchMovieIndex(movieName, movies);
  if (index !== -1) {
    const movieDirector = O.optic<Movie>().prop("director");
    console.log(
      `Director for ${movies[index].title} - `,
      O.get(movieDirector)(movies[index])
    );
  } else {
    return console.log("Movie not found");
  }
};

const updateMovieDetails = (
  movieName: string,
  valueToBeupdated: any,
  value: string | number,
  movies: Movie[]
) => {
  console.log("\n");
  const index = fetchMovieIndex(movieName, movies);
  if (index !== -1) {
    const updatedMovieDetails = O.optic<Movie>().prop(valueToBeupdated);
    console.log(
      `Updated ${valueToBeupdated} for ${movieName} - `,
      O.set(updatedMovieDetails)(value)(movies[index])
    );
  } else {
    return console.log("Movie not Found");
  }
};

const displayAllDirectors = (movies: Movie[]) => {
  console.log("\n");
  console.log("List of Directors:");
  movies.map((mov) => {
    const movieDirector = O.optic<Movie>().prop("director");
    console.log(O.get(movieDirector)(mov));
  });
  console.log("\n");
};

const scrapeData = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}${url}`);
    const $ = cheerio.load(data);
    const movieList = $(".lister-list .lister-item.mode-advanced");
    const movies: Movie[] = [];
    movieList.each((idx, el) => {
      const movie: Movie = {
        rank: "",
        title: "",
        year: "",
        ratings: "",
        metascore: "",
        director: "",
        stars: [],
        genre: "",
        duration: "",
      };
      const moviesContentListElement = $(el).children(".lister-item-content");
      movie.rank = moviesContentListElement
        .children("h3")
        .children("span")
        .eq(0)
        .text()
        .trim()
        .replace(".", "");
      movie.title = moviesContentListElement
        .children("h3")
        .children("a")
        .text();
      movie.year = moviesContentListElement
        .children("h3")
        .children("span")
        .last()
        .text()
        .replace("(", "")
        .replace(")", "");
      movie.ratings = moviesContentListElement
        .children(".ratings-bar")
        .children(".ratings-imdb-rating")
        .children("strong")
        .text();
      movie.metascore = moviesContentListElement
        .children(".ratings-bar")
        .children(".inline-block.ratings-metascore")
        .children("span")
        .text()
        .trim();
      movie.director = moviesContentListElement
        .children("p")
        .eq(2)
        .children("a")
        .eq(0)
        .text();
      const stars = moviesContentListElement.children("p").eq(2).children("a");
      movie.stars = stars
        .map((idx: number) => {
          if (idx > 0) {
            return $(stars[idx]).text();
          }
        })
        .toArray();
      movie.genre = moviesContentListElement
        .children(".text-muted")
        .children(".genre")
        .text()
        .replace("\n", "")
        .trim();
      movie.duration = moviesContentListElement
        .children(".text-muted")
        .children(".runtime")
        .text();
      movies.push(movie);
    });

    getMovieDetails("The Dark Knight", "ratings", movies);

    getDirectorFromMovie("The Dark Knight", movies);

    updateMovieDetails("The Dark Knight", "ratings", 9.5, movies);

    displayAllDirectors(movies);
  } catch (error) {
    console.log("error", error);
  }
};

// Function call to display the scraped data
scrapeData();
