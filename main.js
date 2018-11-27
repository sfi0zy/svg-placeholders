const ColorThief  = require('color-thief');
const getPixels   = require('get-pixels');
const Handlebars  = require('handlebars');
const Voronoi     = require('voronoi');
const triangulate = require('delaunay-triangulate');
const rgbHex      = require('rgb-hex');
const sizeOf      = require('image-size');
const fs          = require('fs');


const thief = new ColorThief();
const voronoi = new Voronoi();

const image  = fs.readFileSync('1.jpg');
const size   = sizeOf('1.jpg');
const height = size.height;
const width  = size.width;


main();



function main() {
    generateOneColor();
    generateGradient();
    generateMosaic();
    generateImprovedMosaic();
    generateTriangulation();
    generateVoronoi();
    generateBlurredMosaic();
}



function generateOneColor() {
    const rgb   = thief.getColor(image);
    const color = '#' + rgbHex(...rgb);

    const template = Handlebars.compile(fs.readFileSync('template-one-color.svg', 'utf-8'));
    const svg = template({
        height,
        width,
        color
    });

    console.log(svg);

    fs.writeFileSync('1-one-color.svg', svg, 'utf-8');
}



function generateGradient() {
    const palette = thief.getPalette(image, 2);

    const startColor = '#' + rgbHex(...palette[0]);
    const endColor   = '#' + rgbHex(...palette[1]);

    const template = Handlebars.compile(fs.readFileSync('template-gradient.svg', 'utf-8'));
    const svg = template({
        height,
        width,
        startColor,
        endColor
    });

    console.log(svg);

    fs.writeFileSync('1-gradient.svg', svg, 'utf-8');
}



function generateMosaic() {
    const palette = thief.getPalette(image, 16);

    palette.forEach(function(color, index) {
        palette[index] = '#' + rgbHex(...color);
    });

    const rects = [];

    for (let x = 0; x < 100; x += 10) {
        for (let y = 0; y < 100; y += 10) {
            const color = palette[Math.floor(Math.random() * 15)];

            rects.push({
                x,
                y,
                color
            });
        }
    }

    const template = Handlebars.compile(fs.readFileSync('template-mosaic.svg', 'utf-8'));
    const svg = template({
        height,
        width,
        rects
    });

    console.log(svg);

    fs.writeFileSync('1-mosaic.svg', svg, 'utf-8');
}



function generateImprovedMosaic() {
    getPixels(image, 'image/jpg', (err, pixels) => {
        if (err) {
            console.log(err);
            return;
        }

        const rects = [];

        for (let x = 0; x < 100; x += 5) {
            const realX = Math.floor(x * width / 100);

            for (let y = 0; y < 100; y += 5) {
                const realY = Math.floor(y * height / 100);
                const pixelPosition = 4 * (realY * width + realX);

                const rgb = [
                    pixels.data[pixelPosition],
                    pixels.data[pixelPosition + 1],
                    pixels.data[pixelPosition + 2]
                ];

                const color = '#' + rgbHex(...rgb);

                rects.push({
                    x,
                    y,
                    color 
                });
            }
        }

        const template = Handlebars.compile(fs.readFileSync('template-improved-mosaic.svg', 'utf-8'));
        const svg = template({
            height,
            width,
            rects
        });

        console.log(svg);

        fs.writeFileSync('1-improved-mosaic.svg', svg, 'utf-8');
    });
}



function generateTriangulation() {
    getPixels(image, 'image/jpg', (err, pixels) => {
        if (err) {
            console.log(err);
            return;
        }

        const basePoints = [];

        for (let x = 0; x <= 100; x += 5) {
            for (let y = 0; y <= 100; y += 5) {
                const point = [x, y];

                if ((x >= 5) && (x <= 95)) {
                    point[0] += Math.floor(10 * Math.random() - 5);
                }

                if ((y >= 5) && (y <= 95)) {
                    point[1] += Math.floor(10 * Math.random() - 5);
                }

                basePoints.push(point);
            }
        }


        const triangles = triangulate(basePoints);

        const polygons = [];

        triangles.forEach((triangle) => {
            let x = Math.floor((basePoints[triangle[0]][0]
                + basePoints[triangle[1]][0]
                + basePoints[triangle[2]][0]) / 3);

            let y = Math.floor((basePoints[triangle[0]][1]
                + basePoints[triangle[1]][1]
                + basePoints[triangle[2]][1]) / 3);

            if (x === 100) {
                x = 99;
            }

            if (y === 100) {
                y = 99;
            }

            const realX = Math.floor(x * width / 100);
            const realY = Math.floor(y * height / 100);

            const pixelPosition = 4 * (realY * width + realX);

            const rgb = [
                pixels.data[pixelPosition],
                pixels.data[pixelPosition + 1],
                pixels.data[pixelPosition + 2]
            ];

            const color = '#' + rgbHex(...rgb);


            const points = ' '
                + basePoints[triangle[0]][0] + ','
                + basePoints[triangle[0]][1] + ' '
                + basePoints[triangle[1]][0] + ','
                + basePoints[triangle[1]][1] + ' '
                + basePoints[triangle[2]][0] + ','
                + basePoints[triangle[2]][1];

            polygons.push({
                points,
                color
            });
        });

        const template = Handlebars.compile(fs.readFileSync('template-triangulation.svg', 'utf-8'));
        const svg = template({
            height,
            width,
            polygons
        });

        console.log(svg);

        fs.writeFileSync('1-triangulation.svg', svg, 'utf-8');
    });
}



function generateVoronoi() {
    getPixels(image, 'image/jpg', (err, pixels) => {
        if (err) {
            console.log(err);
            return;
        }
        const box = {
            xl: 0,
            xr: 100,
            yt: 0,
            yb: 100
        };

        const basePoints = [];

        for (let x = 0; x <= 100; x += 5) {
            for (let y = 0; y <= 100; y += 5) {
                const point = {x, y};

                if ((x >= 5) && (x <= 95)) {
                    point.x += Math.floor(10 * Math.random() - 5);
                }

                if ((y >= 5) && (y <= 95)) {
                    point.y += Math.floor(10 * Math.random() - 5);
                }

                basePoints.push(point);
            }
        }

        const diagram = voronoi.compute(basePoints, box);

        const polygons = [];

        diagram.cells.forEach((cell) => {
            let x = cell.site.x;
            let y = cell.site.y;

            if (x === 100) {
                x = 99;
            }

            if (y === 100) {
                y = 99;
            }

            const realX = Math.floor(x * width / 100);
            const realY = Math.floor(y * height / 100);

            const pixelPosition = 4 * (realY * width + realX);

            const rgb = [
                pixels.data[pixelPosition],
                pixels.data[pixelPosition + 1],
                pixels.data[pixelPosition + 2]
            ];

            const color = '#' + rgbHex(...rgb);

            let points = '';

            cell.halfedges.forEach((halfedge) => {
                const endPoint = halfedge.getEndpoint();

                points += endPoint.x.toFixed(2) + ','
                        + endPoint.y.toFixed(2) + ' ';
            });

            polygons.push({
                points,
                color
            });
        });

        const template = Handlebars.compile(fs.readFileSync('template-voronoi.svg', 'utf-8'));
        const svg = template({
            height,
            width,
            polygons
        });

        console.log(svg);

        fs.writeFileSync('1-voronoi.svg', svg, 'utf-8');
    });
}



function generateBlurredMosaic() {
    getPixels(image, 'image/jpg', (err, pixels) => {
        if (err) {
            console.log(err);
            return;
        }

        const rects = [];

        for (let x = 0; x < 100; x += 5) {
            const realX = Math.floor(x * width / 100);

            for (let y = 0; y < 100; y += 5) {
                const realY = Math.floor(y * height / 100);
                const pixelPosition = 4 * (realY * width + realX);

                const rgb = [
                    pixels.data[pixelPosition],
                    pixels.data[pixelPosition + 1],
                    pixels.data[pixelPosition + 2]
                ];

                const color = '#' + rgbHex(...rgb);

                rects.push({
                    x,
                    y,
                    color 
                });
            }
        }

        const template = Handlebars.compile(fs.readFileSync('template-blurred-mosaic.svg', 'utf-8'));
        const svg = template({
            height,
            width,
            rects
        });

        console.log(svg);

        fs.writeFileSync('1-blurred-mosaic.svg', svg, 'utf-8');
    });
}

